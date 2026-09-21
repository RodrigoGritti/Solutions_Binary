/* =============================================================
   Solutions Binary — whatsapp-bot.js
   Lógica do robô de atendimento: recebe uma mensagem do webhook,
   decide se responde sozinho ou chama um humano, e manda a
   resposta de volta pela WhatsApp Cloud API.

   Resumo do fluxo:
     1. Mensagem chega em server.js -> handleIncomingChange(value)
     2. Se o cliente já está em modo "humano" (você respondeu pelo
        celular, ou pediu atendente), o robô fica quieto.
     3. Senão, pergunta pra IA (Claude) o que responder, usando um
        resumo dos serviços/preços da Solutions Binary.
     4. Manda a resposta pela API oficial do WhatsApp.

   O histórico de conversa fica em memória (Map) — reinicia se o
   servidor reiniciar. Pra guardar de forma permanente no futuro,
   trocar por um banco de dados (ex: Supabase/Postgres).
   ============================================================= */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const BOT_MODEL = process.env.BOT_MODEL || process.env.PREVIEW_MODEL || "claude-sonnet-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "1324480410748649";
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
const GRAPH_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// Quanto tempo o robô fica quieto depois que um humano assume a conversa.
const HANDOFF_HOURS = Number(process.env.BOT_HANDOFF_HOURS || 6);
const HANDOFF_MS = HANDOFF_HOURS * 60 * 60 * 1000;

// Números dos sócios que recebem aviso quando um cliente pede atendente.
// Observação: a Cloud API só entrega mensagem de texto livre pra esses números se
// eles tiverem mandado mensagem pro robô nas últimas 24h (janela de atendimento).
// Fora dessa janela, precisaria de um template aprovado pela Meta.
const NOTIFY_NUMBERS = (process.env.BOT_NOTIFY_NUMBERS || "5519997897813,5548999591614")
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);

const MAX_HISTORY = 12; // mensagens guardadas por contato (pra não estourar o prompt)

/* ---------- resumo da empresa para a IA (mantenha alinhado com data.js) ---------- */
const COMPANY_CONTEXT = `
Seu nome é Atlas — você é o assistente de atendimento da Solutions Binary pelo WhatsApp. Não diga que é uma IA da Anthropic nem cite o nome "Claude".
Na PRIMEIRA mensagem de uma conversa nova, comece se apresentando pelo nome, por exemplo: "Oi! Sou o Atlas, assistente virtual da Solutions Binary." (varie a frase, mas sempre inclua o nome Atlas logo no início). Nas mensagens seguintes da mesma conversa, não repita o nome — só se perguntarem diretamente ("qual seu nome?").

SOBRE A EMPRESA:
Solutions Binary cria tecnologia sob medida para pequenos negócios: sites, cardápios digitais, automações, WhatsApp inteligente e dashboards. Proposta: "Comece pequeno, evolua conforme seu negócio cresce" — implantação acessível + mensalidade previsível (a mensalidade cobre hospedagem, banco de dados, suporte, manutenção e infraestrutura). Fundadores: Rafael da Silva (sites e páginas) e Rodrigo de Almeida Gritti (automações e IA).

SERVIÇOS E PREÇOS (a partir de, podem variar com a complexidade — sempre avise isso):
- Site Essencial: R$397 de implantação + R$49/mês (1 página, responsivo, WhatsApp, hospedagem inclusa)
- Site Profissional: R$697 + R$69/mês (visual personalizado, portfólio, SEO básico)
- Site Premium: a partir de R$997 + R$99/mês (área administrativa, login, banco de dados, integrações)
- Cardápio Essencial: R$297 + R$149/mês (catálogo digital, QR Code, painel pra alterar preços/produtos)
- Cardápio Completo (o mais escolhido): R$397 + R$179/mês (tudo do Essencial + carrinho, checkout, pedidos)
- Cardápio Integrado: R$690 + R$249/mês (tudo do Completo + integração com o sistema/PDV do estabelecimento)
- Automação Express: a partir de R$297 (mensalidade de R$99 só se usar nossa infraestrutura) — planilha vira e-mail, formulário vira banco de dados, relatórios automáticos
- Automação Personalizada: a partir de R$497, projetos médios entre R$497–997, maiores a partir de R$990 (mensalidade R$99–249 quando há servidor/API/integrações)
- WhatsApp Inteligente: R$697 + R$149/mês (respostas automáticas, captação de informações, fluxos de atendimento)
- WhatsApp + IA: a partir de R$997 + R$249/mês (interpretação de mensagens com IA, respostas inteligentes, captação de leads)
- Dashboard Essencial: a partir de R$397 (painel visual com indicadores e gráficos a partir de planilhas)
- Dashboard Automatizado: a partir de R$697 (+R$99/mês opcional) (dados atualizados automaticamente)
- Solução sob medida: a partir de R$497 (quando o problema do cliente não se encaixa nos planos acima)

PERGUNTAS FREQUENTES:
- Por que mensalidade? Mantém tudo no ar: hospedagem, infraestrutura, banco de dados, backups, monitoramento, suporte e manutenção.
- Domínio: pode ser contratado pelo cliente ou administrado pela Solutions Binary; o custo do domínio não entra na mensalidade a menos que especificado.
- Ajustes: pequenos ajustes entram na manutenção; mudanças maiores são orçadas à parte, sempre combinadas antes.
- Cancelamento e reajustes: condições combinadas no início do projeto, por escrito; reajuste de mensalidade sempre avisado com antecedência.
- Programa Clientes Fundadores: ativo agora, com condições especiais para os primeiros clientes (implantação e mensalidade promocional).

COMO RESPONDER:
- Tom direto, simpático e objetivo — como uma pessoa de verdade respondendo no WhatsApp, não um script robótico. Frases curtas.
- Nunca invente preço, prazo ou funcionalidade que não está nesta lista. Se não souber algo específico, diga que vai confirmar com a equipe.
- Se o cliente parecer pronto pra fechar negócio, pedir orçamento fora do padrão, reclamar de algo, ou pedir claramente para falar com uma pessoa, comece sua resposta com a tag "[HANDOFF]" seguida de uma mensagem curta avisando que alguém da equipe vai continuar por ali.
- Nunca peça dados de pagamento ou envie links de pagamento.
`.trim();

/* ---------- estado de cada conversa (em memória) ---------- */
const sessions = new Map(); // phone -> { history: [{role, content}], mode: 'bot'|'humano', humanUntil: number }

function getSession(phone) {
  let s = sessions.get(phone);
  if (!s) {
    s = { history: [], mode: "bot", humanUntil: 0 };
    sessions.set(phone, s);
  }
  // volta pro modo bot automaticamente depois do prazo de handoff
  if (s.mode === "humano" && Date.now() > s.humanUntil) {
    s.mode = "bot";
  }
  return s;
}

function pushHistory(session, role, content) {
  session.history.push({ role, content });
  if (session.history.length > MAX_HISTORY) {
    session.history.splice(0, session.history.length - MAX_HISTORY);
  }
}

const HUMAN_KEYWORDS = [
  "atendente", "humano", "pessoa real", "falar com alguem", "falar com alguém",
  "falar com voces", "falar com vocês", "quero um humano", "suporte humano",
];

function wantsHuman(text) {
  const t = (text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return HUMAN_KEYWORDS.some((k) => t.includes(k.normalize("NFD").replace(/[̀-ͯ]/g, "")));
}

/* ---------- envio de mensagens via Cloud API ---------- */
async function sendWhatsAppText(to, body) {
  if (!WHATSAPP_ACCESS_TOKEN) {
    console.error("[bot] WHATSAPP_ACCESS_TOKEN não configurado — não é possível responder.");
    return;
  }
  try {
    const r = await fetch(GRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("[bot] falha ao enviar mensagem:", r.status, detail.slice(0, 300));
    }
  } catch (err) {
    console.error("[bot] erro ao enviar mensagem:", err && err.message);
  }
}

/* ---------- avisa os sócios quando um cliente pede atendente ---------- */
async function notifyTeam(customerPhone, reason) {
  const text = `⚠️ Cliente ${customerPhone} pediu atendimento humano (${reason}). O robô já pausou essa conversa.`;
  for (const number of NOTIFY_NUMBERS) {
    if (number === customerPhone) continue; // não avisa o próprio cliente, se coincidir
    await sendWhatsAppText(number, text);
  }
}

/* ---------- chamada à IA pra decidir a resposta ---------- */
async function askAssistant(session, isFirstMessage) {
  const system = isFirstMessage
    ? COMPANY_CONTEXT + "\n\n(Esta é a primeira mensagem desta conversa — apresente-se pelo nome Atlas.)"
    : COMPANY_CONTEXT;
  const reqBody = JSON.stringify({
    model: BOT_MODEL,
    max_tokens: 500,
    system,
    messages: session.history,
  });

  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: reqBody,
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    console.error("[bot] Anthropic", r.status, detail.slice(0, 300));
    return null;
  }

  const data = await r.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return text || null;
}

/* ---------- ponto de entrada chamado pelo webhook ---------- */
export async function handleIncomingChange(value) {
  // Mensagem enviada pelo cliente para o número da empresa.
  const message = value?.messages?.[0];
  if (message) {
    await handleCustomerMessage(message);
  }

  // Eco de uma mensagem que VOCÊ mandou pelo WhatsApp Business App no
  // celular — sinal de que um humano já está respondendo essa conversa.
  // (Só chega se o campo "smb_message_echoes" estiver assinado no app.)
  const echo = value?.message_echoes?.[0];
  if (echo?.to) {
    const session = getSession(echo.to);
    session.mode = "humano";
    session.humanUntil = Date.now() + HANDOFF_MS;
    console.log(`[bot] humano respondeu ${echo.to} pelo celular — robô pausado por ${HANDOFF_HOURS}h`);
  }
}

async function handleCustomerMessage(message) {
  const from = message.from;
  const text = message.text?.body || "";
  const session = getSession(from);

  if (!text) {
    console.log(`[bot] mensagem de ${from} sem texto (tipo: ${message.type}) — ignorada pelo robô`);
    return;
  }

  if (session.mode === "humano") {
    console.log(`[bot] ${from} está em modo humano — robô não responde`);
    return;
  }

  if (wantsHuman(text)) {
    pushHistory(session, "user", text);
    session.mode = "humano";
    session.humanUntil = Date.now() + HANDOFF_MS;
    await sendWhatsAppText(from, "Claro! Já aviso a equipe e alguém te chama por aqui em instantes. 🙂");
    await notifyTeam(from, "pediu explicitamente");
    return;
  }

  if (!ANTHROPIC_API_KEY) {
    console.error("[bot] ANTHROPIC_API_KEY não configurada — robô não consegue responder.");
    return;
  }

  const isFirstMessage = session.history.length === 0;
  pushHistory(session, "user", text);

  let reply;
  try {
    reply = await askAssistant(session, isFirstMessage);
  } catch (err) {
    console.error("[bot] erro ao consultar a IA:", err && err.message);
    return;
  }

  if (!reply) return;

  let handoff = false;
  if (reply.startsWith("[HANDOFF]")) {
    handoff = true;
    reply = reply.replace(/^\[HANDOFF\]\s*/, "");
  }

  pushHistory(session, "assistant", reply);
  await sendWhatsAppText(from, reply);

  if (handoff) {
    session.mode = "humano";
    session.humanUntil = Date.now() + HANDOFF_MS;
    console.log(`[bot] handoff acionado pela IA para ${from}`);
    await notifyTeam(from, "a IA identificou necessidade de atendimento");
  }
}
