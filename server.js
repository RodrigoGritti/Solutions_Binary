/* =============================================================
   Solutions Binary — server.js
   Serve as páginas estáticas + um endpoint POST /api/preview que
   usa a IA da Anthropic (Claude) para gerar um mini site/cardápio/
   página personalizado a partir do formulário da prévia interativa.

   A chave da API NUNCA vai para o navegador — fica só em
   process.env.ANTHROPIC_API_KEY (variável de ambiente no Render).

   Usa fetch nativo (Node 18+) direto na REST API em vez do SDK
   para manter o build do Render simples e sem dependência de
   versão de pacote.
   ============================================================= */

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5500;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.PREVIEW_MODEL || "claude-sonnet-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/* ---------- rate limit simples por IP (em memória) ---------- */
const RL_WINDOW_MS = 15 * 60 * 1000; // 15 min
const RL_MAX = 6; // prévias por janela por IP
const hits = new Map(); // ip -> [timestamps]

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}
// limpeza periódica pra não crescer sem limite
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) {
    const keep = arr.filter((t) => now - t < RL_WINDOW_MS);
    if (keep.length) hits.set(ip, keep);
    else hits.delete(ip);
  }
}, RL_WINDOW_MS).unref();

/* ---------- helpers ---------- */
const CATEGORIES = {
  website: "site institucional / landing page",
  cardapio: "cardápio digital",
  automacao: "página de apresentação de um serviço de automação",
  processos: "painel simples de gestão de processos",
  dashboards: "dashboard de indicadores",
};

function clampStr(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
function isHexColor(v) {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

function buildPrompt({ categoryLabel, categoryKey, nome, ramo, extra, color, hasLogo }) {
  const logoLine = hasLogo
    ? 'A empresa TEM logo. No cabeçalho, use exatamente <img src="__LOGO__" alt="' + nome + '" style="height:40px;width:auto"> como marca. Não invente outra logo.'
    : "A empresa NÃO enviou logo. Crie uma marca textual simples com o nome (ou a inicial) usando tipografia forte.";

  return [
    "Você é um(a) designer sênior de web e identidade visual da Solutions Binary.",
    "Crie um MOCKUP realista e profissional para mostrar a um cliente potencial como ficaria a solução dele — o objetivo é impressionar.",
    "",
    "DADOS DO CLIENTE:",
    "- Tipo de peça: " + categoryLabel + " (categoria: " + categoryKey + ")",
    "- Nome da empresa: " + nome,
    "- Ramo do negócio: " + ramo,
    (extra ? "- Detalhe/estilo escolhido: " + extra : ""),
    "- Cor principal da marca: " + color,
    "- " + logoLine,
    "",
    "REGRAS DO ENTREGÁVEL:",
    "- Devolva UM único documento HTML completo e autossuficiente, começando em <!doctype html>.",
    "- Todo o CSS vai inline em uma única tag <style> no <head>. Nada de arquivos externos, exceto (opcional) UMA fonte do Google Fonts via <link> se elevar o design.",
    "- Não use JavaScript (ou no máximo um efeito CSS discreto). Sem dependências externas de script.",
    "- Use a cor " + color + " como cor de destaque principal, com uma paleta coerente (tons, neutros e um contraste de texto legível).",
    "- Conteúdo 100% em português do Brasil, específico para o ramo \"" + ramo + "\". Nada de lorem ipsum: escreva textos, nomes de serviços/produtos e preços plausíveis (R$) que façam sentido para esse negócio.",
    categoryKey === "cardapio"
      ? "- Cardápio: cabeçalho com a marca, 2–3 categorias, 3–4 itens por categoria com nome, descrição curta e preço em R$, e um botão de \"Pedir no WhatsApp\"."
      : categoryKey === "website"
      ? "- Site: cabeçalho com marca e menu, uma seção hero com título forte e CTA, uma seção de serviços/diferenciais (3 itens), uma prova/depoimento curto e um rodapé com contato."
      : "- Estruture as seções típicas dessa peça, de forma enxuta e profissional.",
    "- Responsivo (mobile-first), moderno, com bom espaçamento, hierarquia tipográfica clara e um toque de personalidade ligado ao ramo.",
    "- Tamanho alvo: uma tela e meia de conteúdo. Direto e caprichado.",
    "",
    "IMPORTANTE: responda APENAS com o HTML. Sem comentários, sem explicação, sem cercas de código.",
  ]
    .filter(Boolean)
    .join("\n");
}

function stripFences(s) {
  let t = String(s).trim();
  t = t.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "");
  const i = t.search(/<!doctype html/i);
  if (i > 0) t = t.slice(i);
  return t.trim();
}

/* ---------- API: gera a prévia com IA ---------- */
app.post("/api/preview", express.json({ limit: "64kb" }), async (req, res) => {
  const ip =
    (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ fallback: true, reason: "no_key" });
  }
  if (rateLimited(ip)) {
    return res.status(429).json({ fallback: true, reason: "rate_limited" });
  }

  const body = req.body || {};
  const categoryKey = clampStr(body.category, 20);
  if (!CATEGORIES[categoryKey]) {
    return res.status(400).json({ fallback: true, reason: "bad_category" });
  }
  const nome = clampStr(body.companyName, 60) || "Sua Empresa";
  const ramo = clampStr(body.ramo, 80) || "negócio local";
  const extra = clampStr(body.extra, 40);
  const color = isHexColor(body.color) ? body.color : "#2B3AFF";
  const hasLogo = body.hasLogo === true;

  const prompt = buildPrompt({
    categoryLabel: CATEGORIES[categoryKey],
    categoryKey,
    nome,
    ramo,
    extra,
    color,
    hasLogo,
  });

  const reqBody = JSON.stringify({
    model: MODEL,
    max_tokens: 4200,
    thinking: { type: "disabled" },
    output_config: { effort: "medium" },
    messages: [{ role: "user", content: prompt }],
  });

  async function callAnthropic() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 70000);
    try {
      return await fetch(ANTHROPIC_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: reqBody,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    let r = await callAnthropic();
    // 1 retry em sobrecarga/limite transitório da Anthropic
    if ([429, 500, 502, 503, 529].includes(r.status)) {
      await new Promise((res2) => setTimeout(res2, 2500));
      r = await callAnthropic();
    }

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("[preview] Anthropic", r.status, detail.slice(0, 300));
      return res.status(502).json({ fallback: true, reason: "api_error" });
    }

    const data = await r.json();
    if (data.stop_reason === "refusal") {
      return res.status(200).json({ fallback: true, reason: "refusal" });
    }
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const html = stripFences(text);
    if (!/^<!doctype html/i.test(html)) {
      console.error("[preview] resposta sem HTML válido");
      return res.status(200).json({ fallback: true, reason: "bad_html" });
    }
    return res.json({ html });
  } catch (err) {
    console.error("[preview] erro:", err && err.name, err && err.message);
    return res.status(200).json({ fallback: true, reason: "exception" });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, model: MODEL, keyed: !!ANTHROPIC_API_KEY }));

/* ---------- arquivos estáticos + URLs limpas ---------- */
app.use(
  express.static(__dirname, {
    extensions: ["html"],
    setHeaders: (resp, filePath) => {
      if (/\.(mp4|woff2|png|jpe?g|svg)$/i.test(filePath)) {
        resp.setHeader("Cache-Control", "public, max-age=604800");
      } else if (/\.(html|js|css)$/i.test(filePath)) {
        // páginas e código: revalida sempre para não servir versão antiga após deploy
        resp.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);
function sendPage(res, file) {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(__dirname, file));
}
app.get("/solucoes", (_req, res) => sendPage(res, "solucoes.html"));
app.get("/precos", (_req, res) => sendPage(res, "precos.html"));
app.get("/projetos", (_req, res) => sendPage(res, "projetos.html"));
app.get("/cardapio", (_req, res) => sendPage(res, "cardapio.html"));
app.get("/automacoes", (_req, res) => sendPage(res, "automacoes.html"));
app.get("/sobre", (_req, res) => sendPage(res, "sobre.html"));
app.get("/contato", (_req, res) => sendPage(res, "contato.html"));
app.get("/previa", (_req, res) => sendPage(res, "previa.html"));
// catch-all: qualquer rota desconhecida cai na home (igual ao comportamento antigo)
app.get("*", (_req, res) => sendPage(res, "index.html"));

app.listen(PORT, () => {
  console.log("Solutions Binary no ar na porta " + PORT + " — modelo: " + MODEL + " — API " + (ANTHROPIC_API_KEY ? "ok" : "SEM CHAVE (usa fallback)"));
});
