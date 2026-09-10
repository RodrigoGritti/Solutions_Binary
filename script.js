/* =============================================================
   Solutions Binary — script.js
   Nav mobile · scroll reveal · FAB WhatsApp · formulário + Supabase
   Sem framework, sem build step.
   ============================================================= */

/* -------------------------------------------------------------
   CONFIGURAÇÃO — ajuste estas 3 constantes e o site está pronto
   ------------------------------------------------------------- */

/* Config vem de data.js (window.SB). Fallbacks garantem o site
   funcionando mesmo se data.js não carregar. */
const SB = (window.SB = window.SB || {});
const SB_WA = SB.whatsapp || {};
const WHATSAPP_NUMBER = SB_WA.number || "5548999591614";
const WHATSAPP_MESSAGE =
  SB_WA.default || "Olá! Vim pelo site da Solutions Binary e quero saber mais.";

// Supabase opcional — enquanto não configurado, o formulário cai para o WhatsApp.
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA_ANON_KEY_AQUI";
const SUPABASE_ESM_URL = "https://esm.sh/@supabase/supabase-js@2";

/* -------------------------------------------------------------
   Helpers
   ------------------------------------------------------------- */
const $ = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function waMessageFor(key) {
  const m = SB_WA.messages || {};
  return (key && m[key]) || WHATSAPP_MESSAGE;
}
function waHref(key) {
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(waMessageFor(key));
}
function brl(n) {
  return "R$ " + Number(n).toLocaleString("pt-BR");
}

/* -------------------------------------------------------------
   1. Links de WhatsApp — href a partir de data.js.
      [data-wa]                -> mensagem padrão
      [data-wa][data-wa-context="cardapio"] -> mensagem contextual
   ------------------------------------------------------------- */
(function initWhatsappLinks() {
  $$("[data-wa]").forEach((el) => {
    el.setAttribute("href", waHref(el.getAttribute("data-wa-context")));
  });
})();

/* -------------------------------------------------------------
   2. Ano do rodapé
   ------------------------------------------------------------- */
(function initYear() {
  const el = document.getElementById("ano");
  if (el) el.textContent = String(new Date().getFullYear());
})();

/* -------------------------------------------------------------
   3. Nav: borda ao rolar + item ativo (rastro de luz)
   ------------------------------------------------------------- */
(function initNav() {
  const nav = document.getElementById("nav");
  const links = $$(".nav__link");
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  let ticking = false;

  function update() {
    ticking = false;
    nav.classList.toggle("is-scrolled", window.scrollY > 8);

    if (!sections.length) return;
    const offset = nav.offsetHeight + 24;
    let activeIndex = -1;

    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= offset) activeIndex = i;
    });

    // No fim da página, marca a última seção
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      activeIndex = sections.length - 1;
    }

    links.forEach((link, i) => {
      const on = i === activeIndex;
      link.classList.toggle("is-active", on);
      if (on) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();

/* -------------------------------------------------------------
   4. Menu mobile: overlay, trava de scroll, Esc, foco preso
   ------------------------------------------------------------- */
(function initMobileMenu() {
  const nav = document.getElementById("nav");
  const burger = document.getElementById("navBurger");
  const menu = document.getElementById("mobileMenu");
  if (!burger || !menu) return;

  let isOpen = false;

  function focusables() {
    return [burger].concat(
      $$('a[href], button:not([disabled])', menu).filter((el) => el.offsetParent !== null)
    );
  }

  function open() {
    isOpen = true;
    menu.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Fechar menu de navegação");
    nav.classList.add("is-menu-open");
    document.body.classList.add("is-locked");
    const first = $(".mobile-menu__link", menu);
    if (first) first.focus();
  }

  function close(returnFocus) {
    isOpen = false;
    menu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu de navegação");
    nav.classList.remove("is-menu-open");
    document.body.classList.remove("is-locked");
    if (returnFocus !== false) burger.focus();
  }

  burger.addEventListener("click", () => (isOpen ? close() : open()));

  // Fechar ao navegar (o link é uma âncora interna)
  $$(".mobile-menu__link", menu).forEach((link) => {
    link.addEventListener("click", () => close(false));
  });

  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === "Tab") {
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Se a viewport crescer para desktop, o overlay não faz mais sentido
  window.addEventListener("resize", () => {
    if (isOpen && window.innerWidth >= 1024) close(false);
  });
})();

/* -------------------------------------------------------------
   5. Scroll reveal (uma vez, stagger 70ms)
   ------------------------------------------------------------- */
(function initReveal() {
  const items = $$("[data-reveal]");
  if (!items.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // Stagger por grupo (elementos irmãos revelam em cascata)
  const counters = new Map();
  items.forEach((el) => {
    const parent = el.parentElement;
    const i = counters.get(parent) || 0;
    counters.set(parent, i + 1);
    const delay = Math.min(i, 4) * 70;
    if (delay) el.style.transitionDelay = delay + "ms";
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );

  items.forEach((el) => io.observe(el));
})();

/* -------------------------------------------------------------
   6. FAB WhatsApp: pulso (máx. 2) + esconde na seção de contato
   ------------------------------------------------------------- */
(function initFab() {
  const fab = document.getElementById("fabWhatsapp");
  const contato = document.getElementById("contato");
  if (!fab) return;

  if (contato && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          fab.classList.toggle("is-hidden", entry.intersectionRatio >= 0.5);
        });
      },
      { threshold: [0, 0.5, 1] }
    );
    io.observe(contato);
  }

  if (prefersReducedMotion()) return;

  let pulses = 0;
  const timer = window.setInterval(() => {
    if (pulses >= 2) {
      window.clearInterval(timer);
      return;
    }
    pulses++;
    fab.classList.remove("is-pulsing");
    void fab.offsetWidth; // reinicia a animação
    fab.classList.add("is-pulsing");
  }, 8000);
})();

/* -------------------------------------------------------------
   7. Formulário de contato + Supabase (import dinâmico)
   ------------------------------------------------------------- */
(function initForm() {
  const form = document.getElementById("leadForm");
  if (!form) return;

  const panel = document.getElementById("formPanel");
  const success = document.getElementById("formSuccess");
  const submit = document.getElementById("formSubmit");
  const submitLabel = document.getElementById("formSubmitLabel");
  const alertBox = document.getElementById("formAlert");
  const alertText = document.getElementById("formAlertText");

  const fields = {
    nome: document.getElementById("nome"),
    telefone: document.getElementById("telefone"),
    servico: document.getElementById("servico"),
    mensagem: document.getElementById("mensagem"),
  };

  /* ---- 7.1 Supabase sob demanda ---- */
  let clientPromise = null;

  function loadSupabase() {
    if (clientPromise) return clientPromise;
    clientPromise = import(/* webpackIgnore: true */ SUPABASE_ESM_URL)
      .then((mod) => mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
      .catch((err) => {
        clientPromise = null;
        throw err;
      });
    return clientPromise;
  }

  function isConfigured() {
    return (
      SUPABASE_URL.indexOf("SEU-PROJETO") === -1 &&
      SUPABASE_ANON_KEY.indexOf("SUA_ANON_KEY") === -1
    );
  }

  // Pré-carrega no primeiro foco do formulário...
  form.addEventListener(
    "focusin",
    () => {
      if (isConfigured()) loadSupabase().catch(() => {});
    },
    { once: true }
  );

  // ...ou quando a seção de contato entra no viewport
  const contato = document.getElementById("contato");
  if (contato && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          if (isConfigured()) loadSupabase().catch(() => {});
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(contato);
  }

  /* ---- 7.2 Máscara de telefone ---- */
  function maskPhone(value) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  fields.telefone.addEventListener("input", (e) => {
    const el = e.target;
    const atEnd = el.selectionStart === el.value.length;
    el.value = maskPhone(el.value);
    if (atEnd) el.setSelectionRange(el.value.length, el.value.length);
  });

  /* ---- 7.3 Validação (PT-BR, específica por campo) ---- */
  const validators = {
    nome(v) {
      const s = v.trim();
      if (!s) return "Informe o seu nome para a gente saber como te chamar.";
      if (s.length < 2) return "O nome precisa ter pelo menos 2 caracteres.";
      if (s.length > 80) return "O nome pode ter no máximo 80 caracteres.";
      return "";
    },
    telefone(v) {
      const d = v.replace(/\D/g, "");
      if (!d) return "Informe o seu telefone com DDD.";
      if (d.length < 10 || d.length > 11)
        return "Telefone incompleto. Use DDD + número, ex.: (11) 91234-5678.";
      if (/^(\d)\1+$/.test(d)) return "Esse telefone não parece válido. Confira o número.";
      return "";
    },
    servico(v) {
      if (!v) return "Selecione o serviço de interesse.";
      return "";
    },
    mensagem(v) {
      const s = v.trim();
      if (s && s.length < 5) return "Escreva um pouco mais para a gente entender o contexto.";
      if (s.length > 1000) return "A mensagem pode ter no máximo 1000 caracteres.";
      return "";
    },
  };

  function setError(name, message) {
    const input = fields[name];
    const errorEl = document.getElementById(name + "-erro");
    if (message) {
      input.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      input.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
  }

  function validateField(name) {
    const message = validators[name](fields[name].value);
    setError(name, message);
    return !message;
  }

  Object.keys(fields).forEach((name) => {
    const el = fields[name];
    el.addEventListener("blur", () => validateField(name));
    el.addEventListener("change", () => {
      if (el.classList.contains("has-error") || name === "servico") validateField(name);
    });
    el.addEventListener("input", () => {
      if (el.classList.contains("has-error")) validateField(name);
    });
  });

  /* ---- 7.4 Estados do botão / alerta ---- */
  function setLoading(on) {
    submit.classList.toggle("is-loading", on);
    submit.disabled = on;
    submit.setAttribute("aria-busy", on ? "true" : "false");
    submitLabel.textContent = on ? "Enviando..." : "Receber uma ideia";
  }

  function showAlert(message) {
    alertText.textContent = message;
    alertBox.hidden = false;
    submitLabel.textContent = "Tentar novamente";
  }

  function hideAlert() {
    alertBox.hidden = true;
    alertText.textContent = "";
  }

  /* ---- 7.5 Envio ---- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const names = ["nome", "telefone", "servico", "mensagem"];
    const invalid = names.filter((n) => !validateField(n));
    if (invalid.length) {
      fields[invalid[0]].focus();
      return;
    }

    const empresaEl = document.getElementById("empresa");
    const cidadeEl = document.getElementById("cidade");
    const empresa = empresaEl ? empresaEl.value.trim() : "";
    const cidade = cidadeEl ? cidadeEl.value.trim() : "";
    const utm =
      (window.SBAnalytics && window.SBAnalytics.utmString && window.SBAnalytics.utmString()) || "";

    if (window.track) {
      window.track("submit_lead", { servico: fields.servico.value, cidade: cidade || undefined });
    }

    if (!isConfigured()) {
      // Sem banco de dados configurado ainda: manda os dados preenchidos
      // direto pro WhatsApp cadastrado, em vez de simplesmente falhar.
      const nome = fields.nome.value.trim();
      const telefone = fields.telefone.value.trim();
      const servico = fields.servico.value;
      const mensagem = fields.mensagem.value.trim();

      let texto =
        "Olá! Meu nome é " + nome + " e vim pelo site da Solutions Binary.\n" +
        (empresa ? "Empresa: " + empresa + "\n" : "") +
        (cidade ? "Cidade: " + cidade + "\n" : "") +
        "O que preciso: " + servico + ".\n" +
        "Meu WhatsApp: " + telefone + ".";
      if (mensagem) texto += "\n\n" + mensagem;
      if (utm) texto += "\n\n(" + utm + ")";

      window.open(
        "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(texto),
        "_blank",
        "noopener"
      );

      panel.hidden = true;
      success.hidden = false;
      success.focus();
      return;
    }

    setLoading(true);

    try {
      const supabase = await loadSupabase();
      const { error } = await supabase.from("leads").insert({
        nome: fields.nome.value.trim(),
        empresa: empresa || null,
        cidade: cidade || null,
        telefone: fields.telefone.value.trim(),
        servico_interesse: fields.servico.value,
        mensagem: fields.mensagem.value.trim() || null,
        utm: utm || null,
      });

      if (error) throw error;

      setLoading(false);
      panel.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (err) {
      console.error("[Solutions Binary] Falha ao enviar lead:", err);
      setLoading(false);
      showAlert(
        "Não conseguimos enviar a sua mensagem agora. Verifique a conexão e tente novamente."
      );
    }
  });
})();

/* -------------------------------------------------------------
   7.5 Prévia interativa por categoria de serviço
   Sem chamada de IA nenhuma (sem custo por uso): monta um mockup
   temático na hora, a partir do que a pessoa preencheu. Cada
   categoria tem seu próprio "template" de card/tela/chat.
   ------------------------------------------------------------- */
(function initPreviewWizard() {
  const wizard = document.querySelector(".preview-wizard");
  if (!wizard) return;

  const steps = {
    category: wizard.querySelector('[data-step="category"]'),
    form: wizard.querySelector('[data-step="form"]'),
    loading: wizard.querySelector('[data-step="loading"]'),
    result: wizard.querySelector('[data-step="result"]'),
  };

  function showStep(name) {
    Object.keys(steps).forEach((k) => {
      steps[k].hidden = k !== name;
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function initialOf(nome) {
    const t = String(nome).trim();
    return t ? t[0].toUpperCase() : "?";
  }

  // Detecta o ramo do negócio (texto livre) e devolve um ícone temático —
  // sem foto/API externa nenhuma, só um desenho consistente com o resto do
  // site, pra dar a sensação de "isso é a cara do meu negócio".
  function normalizeRamo(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  const BUSINESS_THEMES = {
    hospedagem: {
      keywords: ["pousada", "hotel", "chale", "hospedagem", "resort", "hostel", "hospedaria", "estalagem", "airbnb"],
      icon: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',
    },
    comida: {
      keywords: ["restaurante", "lanchonete", "pizza", "hamburgueria", "churrascaria", "bar ", "comida", "cozinha", "bistro", "sushi"],
      icon: '<path d="M8 3v6a2 2 0 0 0 4 0V3"/><path d="M10 9v12"/><path d="M17 3c-1.5 1-2 3-2 5s.5 4 2 4 2-2 2-4-.5-4-2-5Z"/><path d="M17 12v9"/>',
    },
    doces: {
      keywords: ["doceria", "confeitaria", "bolo", "doce", "padaria", "confeito", "brigadeiro", "cupcake"],
      icon: '<path d="M7 12h10l-1.2 8.5a1 1 0 0 1-1 .5H9.2a1 1 0 0 1-1-.5Z"/><path d="M8 12a4 4 0 0 1 8 0"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/>',
    },
    beleza: {
      keywords: ["salao", "beleza", "cabelo", "estetica", "barbearia", "manicure", "spa", "maquiagem"],
      icon: '<circle cx="6" cy="6" r="2.3"/><circle cx="6" cy="18" r="2.3"/><path d="m20 5-13 13M8 12l12 8"/>',
    },
    fitness: {
      keywords: ["academia", "fitness", "pilates", "crossfit", "personal", "musculacao", "treino"],
      icon: '<path d="M6.5 7v10M17.5 7v10"/><path d="M2.5 10v4M21.5 10v4"/><path d="M6.5 12h11"/>',
    },
    moda: {
      keywords: ["moda", "roupa", "boutique", "calcado", "vestuario", "confeccao", "estilo"],
      icon: '<path d="M12 3a2 2 0 1 1 2 2"/><path d="M12 5 2.5 12.5 4 15l8-4 8 4 1.5-2.5Z"/><path d="M4.5 15 3 20h18l-1.5-5"/>',
    },
    pet: {
      keywords: ["petshop", "pet ", "veterinar", "banho e tosa", "cachorro", "gato"],
      icon: '<circle cx="7.5" cy="9" r="1.5"/><circle cx="12" cy="6.5" r="1.5"/><circle cx="16.5" cy="9" r="1.5"/><path d="M12 12c-2.8 0-5 2-5 4.3S9 21 12 21s5-2 5-4.7S14.8 12 12 12Z"/>',
    },
    saude: {
      keywords: ["farmacia", "clinica", "saude", "consultorio", "dentista", "fisioterapia", "medic"],
      icon: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>',
    },
    automotivo: {
      keywords: ["oficina", "mecanica", "auto ", "autopecas", "carro", "moto", "pecas"],
      icon: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2Z"/>',
    },
    escritorio: {
      keywords: ["advocacia", "contabilidade", "escritorio", "consultoria", "imobiliaria", "advogado", "contador"],
      icon: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    },
  };

  function detectBusinessTheme(ramo) {
    const n = normalizeRamo(ramo);
    for (const key in BUSINESS_THEMES) {
      if (BUSINESS_THEMES[key].keywords.some((k) => n.includes(k))) return key;
    }
    return null;
  }

  function themeIconSvg(theme, size) {
    if (!theme) return "";
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${BUSINESS_THEMES[theme].icon}</svg>`;
  }

  const CARDAPIO_ICONS = {
    "Restaurante": '<path d="M6 3v5a1.7 1.7 0 0 0 3.4 0V3"/><path d="M7.7 8v9"/><path d="M14 3c-1.2.8-1.7 2.5-1.7 4s.5 3.2 1.7 4"/><path d="M14 11v6"/>',
    "Doceria": '<path d="M6 11h9l-1 6.5a1 1 0 0 1-1 .5H8a1 1 0 0 1-1-.5Z"/><path d="M6.8 11a3.2 3.2 0 0 1 6.4 0"/><path d="M10 7.5V5"/>',
    "Marmitaria": '<rect x="4" y="9" width="13" height="9" rx="1.5"/><path d="M4 9V7.5A1.5 1.5 0 0 1 5.5 6h10A1.5 1.5 0 0 1 17 7.5V9"/>',
    "Lanchonete": '<path d="M4 10a6 6 0 0 1 12 0Z"/><rect x="3.5" y="10" width="13" height="2" rx="1"/><path d="M4.5 14h11l-.6 2.5a1.2 1.2 0 0 1-1.2.9H6.3a1.2 1.2 0 0 1-1.2-.9Z"/>',
  };

  const CATS = {
    website: { label: "Website", extraLabel: "Tipo de site", extraOptions: ["Institucional", "Loja virtual", "Portfólio"] },
    cardapio: { label: "Cardápio digital", extraLabel: "Tipo de cardápio", extraOptions: ["Restaurante", "Doceria", "Marmitaria", "Lanchonete"] },
    automacao: { label: "Automação", extraLabel: "Canal principal", extraOptions: ["WhatsApp", "Instagram", "E-mail"] },
    processos: { label: "Organizar processos", extraLabel: "O que quer controlar", extraOptions: ["Estoque", "Agendamentos", "Pedidos", "Documentos"] },
    dashboards: { label: "Dashboards simples", extraLabel: "Área que quer acompanhar", extraOptions: ["Vendas", "Financeiro", "Operação", "Marketing"] },
  };

  const CARDAPIO_ITEMS = {
    "Restaurante": [["Prato executivo", "Feito na hora", "32,90"], ["Combo do dia", "Entrada + prato + sobremesa", "45,00"], ["Sobremesa da casa", "Receita própria", "14,50"]],
    "Doceria": [["Brigadeiro gourmet", "Caixa com 6 un.", "28,00"], ["Bolo no pote", "Sabor do dia", "16,90"], ["Caixa surpresa", "Seleção especial", "39,90"]],
    "Marmitaria": [["Marmita fitness", "300g, low carb", "24,90"], ["Marmita tradicional", "Arroz, feijão e carne", "19,90"], ["Combo família", "Serve até 4 pessoas", "69,90"]],
    "Lanchonete": [["Combo lanche", "Lanche + batata + bebida", "28,90"], ["Batata especial", "Com cheddar e bacon", "18,00"], ["Milkshake", "Vários sabores", "14,90"]],
  };

  function mockWebsite({ nome, ramo, extra, logoUrl }) {
    const n = escapeHtml(nome), r = escapeHtml(ramo.toLowerCase()), t = escapeHtml(extra.toLowerCase());
    const theme = detectBusinessTheme(ramo);
    return `<div class="mock-site">
      <div class="mock-site__nav">
        <span class="mock-site__logo">${logoUrl ? `<img src="${logoUrl}" alt="">` : ""}${n}</span>
        <span class="mock-site__navlink">Início</span>
        <span class="mock-site__navlink">Serviços</span>
        <span class="mock-site__cta">Fale conosco</span>
      </div>
      <div class="mock-site__hero">
        <div class="mock-site__hero-text">
          <h3>${n} — ${t} feito sob medida</h3>
          <p>Presença online profissional para o seu ${r}.</p>
          <span class="mock-site__btn">Começar agora</span>
        </div>
        <div class="mock-site__hero-visual" style="color:#fff" aria-hidden="true">${themeIconSvg(theme, 40)}</div>
      </div>
      <div class="mock-site__features">
        <div class="mock-site__feature"></div><div class="mock-site__feature"></div><div class="mock-site__feature"></div>
      </div>
      <div class="mock-site__footer">© ${new Date().getFullYear()} ${n} — todos os direitos reservados</div>
    </div>`;
  }

  function mockCardapio({ nome, extra, logoUrl }) {
    const items = CARDAPIO_ITEMS[extra] || CARDAPIO_ITEMS["Restaurante"];
    const iconPath = CARDAPIO_ICONS[extra] || CARDAPIO_ICONS["Restaurante"];
    const itemIcon = `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>`;
    const itemsHtml = items.map(([n, d, p]) => `
      <div class="mock-cardapio__item">
        <span class="mock-cardapio__thumb">${itemIcon}</span>
        <div><strong>${escapeHtml(n)}</strong><small>${escapeHtml(d)}</small></div>
        <span class="mock-cardapio__price">R$ ${p}</span>
      </div>`).join("");
    return `<div class="mock-cardapio">
      <div class="mock-cardapio__head">
        <span class="mock-cardapio__logo">${logoUrl ? `<img src="${logoUrl}" alt="">` : escapeHtml(initialOf(nome))}</span>
        <div><strong>${escapeHtml(nome)}</strong><small>${escapeHtml(extra)}</small></div>
      </div>
      <div class="mock-cardapio__meta">
        <span>⭐ 4.8 (230)</span>
        <span>🛵 25-35 min</span>
        <span>💳 Pix e cartão</span>
      </div>
      <div class="mock-cardapio__items">${itemsHtml}</div>
      <span class="mock-cardapio__cta">Pedir no WhatsApp</span>
    </div>`;
  }

  function mockAutomacao({ nome, ramo, extra }) {
    const bubbles = [
      { in: true, text: `Olá! Vim pelo ${extra} e queria saber se vocês atendem ${ramo.toLowerCase()}.`, time: "14:31" },
      { in: false, text: `Oi! Sim, atendemos sim 😊 Sou o assistente virtual da ${nome}. Como posso te ajudar hoje?`, time: "14:31" },
      { in: true, text: "Queria saber os horários e como faço pra agendar.", time: "14:32" },
      { in: false, text: "Consigo te passar tudo certinho agora mesmo, sem precisar esperar um atendente 👍", time: "14:32" },
    ];
    const bubblesHtml = bubbles.map((b) => `<div class="mock-wa__bubble mock-wa__bubble--${b.in ? "in" : "out"}">${escapeHtml(b.text)}<span class="mock-wa__time">${b.time}</span></div>`).join("");
    const theme = detectBusinessTheme(ramo);
    return `<div class="mock-wa">
      <div class="mock-wa__head">
        <span class="mock-wa__avatar">${escapeHtml(initialOf(nome))}</span>
        <div><strong>${escapeHtml(nome)}</strong><small>online</small></div>
        ${theme ? `<span class="mock-theme-chip mock-theme-chip--on-color" aria-hidden="true">${themeIconSvg(theme, 13)}</span>` : ""}
      </div>
      <div class="mock-wa__body">${bubblesHtml}
        <div class="mock-wa__typing" aria-hidden="true"><span></span><span></span><span></span></div>
      </div>
    </div>`;
  }

  function mockProcessos({ nome, ramo, extra }) {
    const theme = detectBusinessTheme(ramo);
    const chip = theme ? `<span class="mock-theme-chip mock-theme-chip--on-light mock-theme-chip--inline" aria-hidden="true">${themeIconSvg(theme, 12)}</span>` : "";
    return `<div class="mock-kanban">
      <div class="mock-kanban__side" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="mock-kanban__main">
        <div class="mock-kanban__head">
          <div><strong>${escapeHtml(nome)}${chip}</strong><small>Controle de ${escapeHtml(extra.toLowerCase())}</small></div>
          <span class="mock-kanban__filter">Esta semana</span>
        </div>
        <div class="mock-kanban__cols">
          <div class="mock-kanban__col"><h4>Pendente</h4><span class="mock-kanban__card"></span><span class="mock-kanban__card"></span></div>
          <div class="mock-kanban__col"><h4>Em andamento</h4><span class="mock-kanban__card"></span></div>
          <div class="mock-kanban__col"><h4>Concluído</h4><span class="mock-kanban__card"></span><span class="mock-kanban__card"></span></div>
        </div>
      </div>
    </div>`;
  }

  const DASH_KPIS = {
    "Vendas": [["128", "Pedidos"], ["R$ 12,4k", "Faturamento"], ["+18%", "Crescimento"]],
    "Financeiro": [["R$ 48,2k", "Receita"], ["R$ 31,6k", "Despesas"], ["R$ 16,6k", "Saldo"]],
    "Operação": [["94%", "Eficiência"], ["312", "Produção"], ["6%", "Ociosidade"]],
    "Marketing": [["842", "Leads"], ["12%", "Conversão"], ["R$ 38", "Custo por lead"]],
  };

  function mockDashboards({ nome, ramo, extra }) {
    const kpis = DASH_KPIS[extra] || DASH_KPIS["Vendas"];
    const kpisHtml = kpis.map(([v, l]) => `<div class="mock-dash__kpi"><span>${escapeHtml(v)}</span><small>${escapeHtml(l)}</small></div>`).join("");
    const theme = detectBusinessTheme(ramo);
    const chip = theme ? `<span class="mock-theme-chip mock-theme-chip--on-dark mock-theme-chip--inline" aria-hidden="true">${themeIconSvg(theme, 12)}</span>` : "";
    return `<div class="mock-dash">
      <div class="mock-dash__head">
        <div><strong>${escapeHtml(nome)}${chip}</strong><small>Painel de ${escapeHtml(extra.toLowerCase())}</small></div>
        <span class="mock-dash__export">Exportar</span>
      </div>
      <div class="mock-dash__kpis">${kpisHtml}</div>
      <div class="mock-dash__charts">
        <div class="mock-dash__bars"><span style="--h:40%"></span><span style="--h:70%"></span><span style="--h:55%"></span><span style="--h:90%"></span><span style="--h:65%"></span></div>
        <div class="mock-dash__donut"></div>
      </div>
    </div>`;
  }

  const MOCK_BUILDERS = {
    website: mockWebsite, cardapio: mockCardapio, automacao: mockAutomacao,
    processos: mockProcessos, dashboards: mockDashboards,
  };

  const extraSelect = document.getElementById("pv-extra");
  const extraLabel = document.getElementById("pv-extra-label");
  const nomeInput = document.getElementById("pv-nome");
  const ramoInput = document.getElementById("pv-ramo");
  const logoInput = document.getElementById("pv-logo");
  const logoPreview = document.getElementById("pv-logo-preview");
  const form = document.getElementById("previewForm");
  const frame = document.getElementById("previewFrame");
  const mockEl = document.getElementById("previewMock");
  const waLink = document.getElementById("previewWaLink");
  const catButtons = $$(".preview-cat", wizard);
  const colorButtons = $$(".preview-swatch", wizard);

  let state = { cat: null, color: "#2B3AFF", logoUrl: "" };

  catButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      catButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.cat = btn.getAttribute("data-cat");
      const cfg = CATS[state.cat];
      extraLabel.textContent = cfg.extraLabel;
      extraSelect.innerHTML = cfg.extraOptions.map((o) => `<option value="${o}">${o}</option>`).join("");
      showStep("form");
    });
  });

  $$('[data-action="to-category"]', wizard).forEach((b) => b.addEventListener("click", () => showStep("category")));
  $$('[data-action="to-form"]', wizard).forEach((b) => b.addEventListener("click", () => showStep("form")));
  $$('[data-action="restart"]', wizard).forEach((b) => b.addEventListener("click", () => {
    catButtons.forEach((b2) => b2.classList.remove("is-active"));
    showStep("category");
  }));

  colorButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      colorButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.color = btn.getAttribute("data-color");
    });
  });

  logoInput.addEventListener("change", () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.logoUrl = String(reader.result);
      logoPreview.innerHTML = `<img src="${state.logoUrl}" alt="">`;
    };
    reader.readAsDataURL(file);
  });

  function buildWaLink(nome, ramo) {
    const texto = `Olá! Testei a prévia de "${CATS[state.cat].label}" no site (empresa: ${nome}, ramo: ${ramo}) e quero saber mais sobre como isso ficaria pra mim de verdade.`;
    waLink.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(texto));
  }

  // Renderiza o mockup por template (fallback — usado se a IA falhar)
  function renderTemplate(nome, ramo, extra) {
    frame.classList.remove("preview-frame--ai");
    frame.style.setProperty("--pv", state.color);
    mockEl.innerHTML = MOCK_BUILDERS[state.cat]({ nome, ramo, extra, logoUrl: state.logoUrl });
  }

  // Renderiza o HTML gerado pela IA dentro de um iframe isolado (sandbox)
  function renderAi(html) {
    frame.classList.add("preview-frame--ai");
    mockEl.textContent = "";
    const iframe = document.createElement("iframe");
    iframe.className = "preview-iframe";
    iframe.setAttribute("sandbox", "allow-scripts"); // sem allow-same-origin: fica em origem opaca, não toca a página
    iframe.setAttribute("title", "Prévia gerada por IA");
    let doc = String(html);
    if (state.logoUrl) doc = doc.split("__LOGO__").join(state.logoUrl);
    iframe.srcdoc = doc;
    mockEl.appendChild(iframe);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = nomeInput.value.trim();
    const ramo = ramoInput.value.trim();
    if (!nome) { nomeInput.focus(); return; }
    if (!ramo) { ramoInput.focus(); return; }
    const extra = extraSelect.value;

    showStep("loading");
    buildWaLink(nome, ramo);

    let usedAi = false;
    try {
      const ctrl = new AbortController();
      const to = window.setTimeout(() => ctrl.abort(), 55000);
      const resp = await fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          category: state.cat,
          companyName: nome,
          ramo: ramo,
          extra: extra,
          color: state.color,
          hasLogo: !!state.logoUrl,
        }),
      });
      window.clearTimeout(to);
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data && data.html) {
          renderAi(data.html);
          usedAi = true;
        }
      }
    } catch (_) {
      /* rede/timeout — cai no template abaixo */
    }

    if (!usedAi) renderTemplate(nome, ramo, extra);

    showStep("result");
    frame.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  });
})();

/* -------------------------------------------------------------
   8. Cena do hero: rede de partículas + núcleo de IA (canvas 2D)
   Leve de propósito — sem WebGL/Three.js: laço pausa fora da tela
   e respeita prefers-reduced-motion.
   ------------------------------------------------------------- */
(function initHeroScene() {
  const canvas = document.querySelector(".hero__scene");
  const hero = document.getElementById("topo");
  if (!canvas || !hero) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = prefersReducedMotion();
  const DIGITS = ["0", "1"];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let meteors = [];
  let nextMeteorAt = 0;
  let rafId = null;
  let running = false;
  let t = 0;

  // layout de 2 colunas (desktop, >=1024px): texto à esquerda, vídeo à direita.
  // Abaixo disso o hero empilha (texto no topo, vídeo depois).
  function isTwoCol() {
    return width >= 1024;
  }

  // O céu de partículas acompanha a coluna de texto de verdade (medida no
  // DOM), em vez de um "50%" fixo — assim ele fica sempre centralizado
  // atrás do texto, mesmo se o layout/gap do texto mudar depois.
  let textZoneRight = 0;
  let textZoneCenterX = 0;
  function measureTextZone() {
    if (!isTwoCol()) {
      textZoneRight = width;
      textZoneCenterX = width * 0.5;
      return;
    }
    const copyEl = document.querySelector(".hero__copy");
    const heroRect = hero.getBoundingClientRect();
    if (copyEl && heroRect.width) {
      const r = copyEl.getBoundingClientRect();
      const pad = 36;
      textZoneRight = Math.min(width, r.right - heroRect.left + pad);
      textZoneCenterX = (r.left - heroRect.left + r.right - heroRect.left) / 2;
    } else {
      textZoneRight = width * 0.5;
      textZoneCenterX = width * 0.26;
    }
  }

  function fieldWidth() {
    return isTwoCol() ? textZoneRight : width;
  }
  function core() {
    return isTwoCol() ? { x: textZoneCenterX, y: height * 0.24 } : { x: width * 0.5, y: height * 0.16 };
  }
  function safeZone() {
    return isTwoCol()
      ? { x0: 0, x1: textZoneRight, y0: 0, y1: height }
      : { x0: width * 0.06, x1: width * 0.94, y0: 0, y1: height * 0.46 };
  }
  function inSafeZone(x, y) {
    const z = safeZone();
    return x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1;
  }

  function makeParticle(orbiter) {
    if (orbiter) {
      return {
        orbiter: true,
        angle: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.15,
        radius: 26 + Math.random() * 34,
        size: 1.6 + Math.random() * 1.4,
        x: 0,
        y: 0,
      };
    }
    return {
      orbiter: false,
      x: Math.random() * fieldWidth(),
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      size: 1.1 + Math.random() * 1.8,
      digit: Math.random() < 0.3,
      glyph: DIGITS[Math.floor(Math.random() * DIGITS.length)],
      fontSize: 11 + Math.random() * 9,
      baseAlpha: 0.25 + Math.random() * 0.45,
    };
  }

  function seed() {
    const count = width < 640 ? 52 : width < 1100 ? 76 : 100;
    particles = [];
    for (let i = 0; i < count; i++) particles.push(makeParticle(false));
    for (let i = 0; i < 9; i++) particles.push(makeParticle(true));
  }

  // Mede o vão real entre a borda do hero e a borda do .container (em vez
  // de tentar recalcular isso com 100vw, que inclui ou não a barra de
  // rolagem dependendo do navegador — medir no DOM não erra nunca).
  function updateEdgeGaps() {
    const grid = document.querySelector(".hero__grid");
    if (!grid) return;
    const heroRect = hero.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const leftGap = Math.max(0, gridRect.left - heroRect.left);
    const rightGap = Math.max(0, heroRect.right - gridRect.right);
    hero.style.setProperty("--left-gap", leftGap + "px");
    hero.style.setProperty("--right-gap", rightGap + "px");
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateEdgeGaps();
    measureTextZone();
    seed();
  }

  function drawCore(cx, cy) {
    const pulse = 0.5 + Math.sin(t * 0.05) * 0.5;
    const r = 46 + pulse * 14;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
    glow.addColorStop(0, "rgba(127,209,255," + (0.32 + pulse * 0.15) + ")");
    glow.addColorStop(1, "rgba(127,209,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // "estrelas cadentes": dígitos binários que cruzam a tela de vez em quando
  function maybeSpawnMeteor(now) {
    if (now < nextMeteorAt) return;
    nextMeteorAt = now + 3200 + Math.random() * 4600;

    const fw = fieldWidth();
    const fromLeft = Math.random() < 0.5;
    const angleDeg = 22 + Math.random() * 20; // sempre descendo, em diagonal
    const angle = (angleDeg * Math.PI) / 180;
    const speed = (width < 640 ? 8.5 : 12) + Math.random() * 5;
    const dir = fromLeft ? 1 : -1;

    meteors.push({
      x: fromLeft ? -30 : fw + 30,
      y: height * (0.03 + Math.random() * 0.4),
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
      glyph: DIGITS[Math.floor(Math.random() * DIGITS.length)],
      fontSize: 16 + Math.random() * 9,
      trail: [],
    });
  }

  function updateAndDrawMeteors() {
    meteors.forEach((m) => {
      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > 12) m.trail.shift();
      m.x += m.vx;
      m.y += m.vy;
    });
    meteors = meteors.filter((m) => m.x > -80 && m.x < fieldWidth() + 80 && m.y < height + 80);

    meteors.forEach((m) => {
      for (let i = 0; i < m.trail.length; i++) {
        const p = m.trail[i];
        const a = (i / m.trail.length) * 0.45;
        ctx.fillStyle = "rgba(127,209,255," + a + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = m.fontSize + "px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(127,209,255,.9)";
      ctx.shadowBlur = 12;
      ctx.fillText(m.glyph, m.x, m.y);
      ctx.shadowBlur = 0;
    });
  }

  function step() {
    t += 1;
    ctx.clearRect(0, 0, width, height);

    const c = core();
    const cx = c.x;
    const cy = c.y;
    drawCore(cx, cy);

    if (!reduceMotion) {
      maybeSpawnMeteor(performance.now());
      updateAndDrawMeteors();
    }

    particles.forEach((p) => {
      if (p.orbiter) {
        p.angle += p.speed * 0.02;
        p.x = cx + Math.cos(p.angle) * p.radius;
        p.y = cy + Math.sin(p.angle) * p.radius * 0.7;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        const fw = fieldWidth();
        if (p.x < -20) p.x = fw + 20;
        if (p.x > fw + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }
    });

    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const max = a.orbiter || b.orbiter ? 90 : 120;
        if (dist >= max) continue;
        const inZone = inSafeZone(a.x, a.y) || inSafeZone(b.x, b.y);
        const alpha = (1 - dist / max) * (inZone ? 0.06 : 0.16);
        if (alpha <= 0.005) continue;
        ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    particles.forEach((p) => {
      const inZone = !p.orbiter && inSafeZone(p.x, p.y);
      const alpha = p.orbiter ? 0.75 : inZone ? p.baseAlpha * 0.35 : p.baseAlpha;

      if (p.digit && !inZone) {
        ctx.font = p.fontSize + "px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = "rgba(255,255,255," + alpha + ")";
        ctx.shadowColor = "rgba(127,209,255,.8)";
        ctx.shadowBlur = 8;
        ctx.fillText(p.glyph, p.x, p.y);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = p.orbiter ? "rgba(255,255,255," + alpha + ")" : "rgba(214,224,255," + alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (running) rafId = window.requestAnimationFrame(step);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    rafId = window.requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  resize();

  if (reduceMotion) {
    step();
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.05 }
    );
    io.observe(hero);
  } else {
    start();
  }

  let resizeTimer = null;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      if (reduceMotion) step();
    }, 150);
  }

  // ResizeObserver acompanha o tamanho real do próprio hero (cobre mudanças
  // de layout/fontes que o evento "resize" da janela não cobre) — e o
  // "resize" da janela fica como reforço, caso o ResizeObserver não dispare.
  if ("ResizeObserver" in window) {
    new ResizeObserver(onResize).observe(hero);
  }
  window.addEventListener("resize", onResize, { passive: true });
})();

/* -------------------------------------------------------------
   9. Contadores animados (métricas)
   ------------------------------------------------------------- */
(function initCounters() {
  const items = $$(".metric__value[data-count]");
  if (!items.length) return;

  function formatNumber(n) {
    return n.toLocaleString("pt-BR");
  }

  function animate(el) {
    const target = parseInt(el.getAttribute("data-count"), 10);
    const suffix = el.getAttribute("data-suffix") || "";

    if (prefersReducedMotion()) {
      el.textContent = formatNumber(target) + suffix;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(Math.round(target * eased)) + suffix;
      if (progress < 1) window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  if (!("IntersectionObserver" in window)) {
    items.forEach(animate);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  items.forEach((el) => io.observe(el));
})();

/* -------------------------------------------------------------
   10. Analytics — preparado (sem GA4/GTM ainda).
   window.track(nome, props) empilha em window.dataLayer.
   Eventos: click_whatsapp, click_demo, click_pricing, view_case,
   view_solution, submit_lead. UTMs guardadas em sessionStorage.
   ------------------------------------------------------------- */
(function initAnalytics() {
  window.dataLayer = window.dataLayer || [];
  window.track = function (name, props) {
    try {
      // GTM / genérico
      window.dataLayer.push(Object.assign({ event: name, ts: Date.now() }, props || {}));
      // GA4 (gtag.js) — quando o snippet está presente
      if (typeof window.gtag === "function") window.gtag("event", name, props || {});
    } catch (e) {}
  };

  // --- UTMs: captura da URL e persiste na sessão ---
  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  let stored = {};
  try {
    stored = JSON.parse(sessionStorage.getItem("sb_utm") || "{}");
  } catch (e) {}
  const params = new URLSearchParams(location.search);
  let touched = false;
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) {
      stored[k] = v;
      touched = true;
    }
  });
  if (touched) {
    try {
      sessionStorage.setItem("sb_utm", JSON.stringify(stored));
    } catch (e) {}
  }
  window.SBAnalytics = {
    utm: stored,
    utmString: function () {
      return Object.keys(stored)
        .map((k) => k + "=" + stored[k])
        .join("; ");
    },
  };

  // --- cliques marcados com [data-analytics] ---
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest("[data-analytics]");
      if (!el) return;
      const name = el.getAttribute("data-analytics");
      if (!name || name.indexOf("view_") === 0) return;
      window.track(name, {
        text: (el.textContent || "").trim().slice(0, 60),
        href: el.getAttribute("href") || undefined,
      });
    },
    true
  );

  // --- visualizações: [data-analytics^="view_"] ---
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio < 0.5) return;
          const el = entry.target;
          vio.unobserve(el);
          window.track(el.getAttribute("data-analytics"), {
            label: (el.textContent || "").trim().slice(0, 60),
          });
        });
      },
      { threshold: 0.5 }
    );
    $$('[data-analytics^="view_"]').forEach((el) => vio.observe(el));
  }
})();

/* -------------------------------------------------------------
   11. Preços e produtos — render a partir de window.SB (data.js)
   Funciona em index.html, solucoes.html e precos.html: cada
   bloco só é montado se o elemento existir na página.
   ------------------------------------------------------------- */
(function initPricing() {
  const P = SB.pricing;
  if (!P || !Array.isArray(P.families)) return;

  const ICONS = {
    cardapio: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    site: '<rect x="3" y="4" width="18" height="15" rx="2.5"/><path d="M3 9h18M6.4 6.5h.01M9.2 6.5h.01"/><path d="M9 22h6"/>',
    automacao: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    whatsapp: '<rect x="3" y="4" width="18" height="13" rx="4"/><path d="m7 17-1 3 4-3"/>',
    dashboard: '<rect x="3" y="10" width="4" height="10" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="17" y="13" width="4" height="7" rx="1"/>',
    custom: '<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9 2.6.9-5.5-4-3.9 5.5-.8z"/>',
  };
  function iconSvg(name) {
    return (
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || ICONS.custom) +
      "</svg>"
    );
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function setupLabel(plan) {
    return (plan.setupFrom ? "a partir de " : "") + brl(plan.setup);
  }
  function monthlyLabel(plan) {
    if (plan.monthly) return "+ " + brl(plan.monthly) + "/mês";
    if (plan.monthlyOptional) return "+ " + brl(plan.monthlyOptional) + "/mês (opcional)";
    if (plan.monthlyRange) return "+ R$ " + plan.monthlyRange[0] + "–" + plan.monthlyRange[1] + "/mês";
    return "";
  }
  function cheapest(fam) {
    return fam.plans[0];
  }
  function discountFor(fam, plan) {
    const fp = SB.founderProgram;
    if (!fp || !fp.enabled || !fp.discounts) return null;
    return fp.discounts[fam.slug + ":" + plan.name] || null;
  }

  /* ---- faixa "a partir de" do hero ---- */
  const heroStrip = document.getElementById("heroPricing");
  if (heroStrip) {
    const pick = ["cardapio", "site", "automacao"];
    heroStrip.innerHTML = pick
      .map((slug) => {
        const fam = P.families.find((f) => f.slug === slug);
        if (!fam) return "";
        return (
          '<li><span class="hero__pricing-name">' +
          esc(fam.name) +
          '</span><span class="hero__pricing-val">' +
          setupLabel(cheapest(fam)) +
          "</span></li>"
        );
      })
      .join("");
  }

  /* ---- grade de produtos (home) ---- */
  const grid = document.getElementById("productGrid");
  if (grid) {
    grid.innerHTML = P.families
      .map((fam) => {
        const c = cheapest(fam);
        return (
          '<article class="product-card' +
          (fam.featured ? " product-card--featured" : "") +
          '" data-analytics="view_solution">' +
          '<span class="product-card__ico" aria-hidden="true">' + iconSvg(fam.icon) + "</span>" +
          '<h3 class="product-card__name">' + esc(fam.name) + "</h3>" +
          '<p class="product-card__summary">' + esc(fam.summary) + "</p>" +
          '<p class="product-card__price"><span class="price__from">a partir de</span> ' +
          '<strong>' + brl(c.setup) + "</strong>" +
          (monthlyLabel(c) ? ' <span class="price__monthly">' + monthlyLabel(c).replace("+ ", "") + "</span>" : "") +
          "</p>" +
          '<div class="product-card__cta">' +
          '<a class="btn btn--primary btn--sm" data-wa data-wa-context="' + esc(fam.waContext || "") + '" data-analytics="click_whatsapp" href="' + waHref(fam.waContext) + '" target="_blank" rel="noopener">' + esc(fam.ctaLabel || ("Falar sobre " + fam.name)) + "</a>" +
          '<a class="btn btn--secondary btn--sm" href="solucoes.html#' + fam.slug + '" data-analytics="click_pricing">Ver detalhes</a>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---- tabela de preços (home + precos.html) ---- */
  function renderTable(el, full) {
    const rows = [];
    P.families.forEach((fam) => {
      fam.plans.forEach((plan) => {
        const d = discountFor(fam, plan);
        const setupHtml = d
          ? '<s>' + brl(d.normalSetup) + "</s> <strong>" + brl(d.founderSetup) + "</strong>"
          : "<strong>" + setupLabel(plan) + "</strong>";
        const feat = full ? plan.features : plan.features.slice(0, 4);
        rows.push(
          '<div class="ptable__row">' +
            '<div class="ptable__name">' + esc(plan.name) + (plan.tag ? ' <span class="ptable__tag">' + esc(plan.tag) + "</span>" : "") + "</div>" +
            '<div class="ptable__setup"><span class="ptable__k">Implantação</span>' + setupHtml + "</div>" +
            '<div class="ptable__monthly"><span class="ptable__k">Mensalidade</span>' + (monthlyLabel(plan).replace("+ ", "") || "—") + "</div>" +
            '<div class="ptable__feat"><span class="ptable__k">Inclui</span>' + feat.map(esc).join(" · ") + (plan.note ? '<em class="ptable__note">' + esc(plan.note) + "</em>" : "") + "</div>" +
          "</div>"
        );
      });
    });
    el.innerHTML = rows.join("");
  }
  const homeTable = document.getElementById("pricingTable");
  if (homeTable) renderTable(homeTable, false);
  const fullTable = document.getElementById("precosTable");
  if (fullTable) renderTable(fullTable, true);

  const noteEl = document.getElementById("pricingNote");
  if (noteEl && P.note) noteEl.textContent = P.note;

  /* ---- explicador implantação × mensalidade ---- */
  const be = document.getElementById("billingExplainer");
  if (be && SB.billing) {
    const b = SB.billing;
    be.innerHTML =
      "<h3>" + esc(b.title) + "</h3>" +
      "<p>" + esc(b.setup) + "</p>" +
      "<p>" + esc(b.monthly) + "</p>" +
      '<ul class="billing-explainer__list">' + b.monthlyItems.map((i) => "<li>" + esc(i) + "</li>").join("") + "</ul>" +
      (b.domain ? '<p class="billing-explainer__domain">' + esc(b.domain) + "</p>" : "");
  }

  /* ---- catálogo completo (solucoes.html) ---- */
  function planWa(fam, plan) {
    return plan.waContext || fam.waContext || "";
  }
  function planCta(fam, plan) {
    return plan.ctaLabel || fam.ctaLabel || ("Falar sobre " + fam.name);
  }
  function billingNoteHtml(fam) {
    const bn = fam.billingNote;
    if (!bn) return "";
    return (
      '<div class="billing-note" data-analytics="view_solution">' +
      "<h3>" + esc(bn.title) + "</h3>" +
      (bn.intro ? "<p>" + esc(bn.intro) + "</p>" : "") +
      '<ul class="billing-note__list">' + (bn.items || []).map((i) => "<li>" + esc(i) + "</li>").join("") + "</ul>" +
      (bn.message ? '<p class="billing-note__msg">' + esc(bn.message) + "</p>" : "") +
      "</div>"
    );
  }
  const catalog = document.getElementById("catalog");
  if (catalog) {
    catalog.innerHTML = P.families
      .map((fam) => {
        const plans = fam.plans
          .map((plan) => {
            const d = discountFor(fam, plan);
            const priceHtml = d
              ? '<s>' + brl(d.normalSetup) + "</s> <strong>" + brl(d.founderSetup) + "</strong>"
              : "<strong>" + setupLabel(plan) + "</strong>";
            const wa = planWa(fam, plan);
            return (
              '<div class="plan-card' + (plan.tag ? " plan-card--tag" : "") + (plan.featured ? " plan-card--featured" : "") + '">' +
              (plan.tag ? '<span class="plan-card__tag">' + esc(plan.tag) + "</span>" : "") +
              '<h3 class="plan-card__name">' + esc(plan.name) + "</h3>" +
              '<p class="plan-card__price">' + priceHtml + (monthlyLabel(plan) ? ' <span>' + esc(monthlyLabel(plan)) + "</span>" : "") + "</p>" +
              '<ul class="plan-card__features">' + plan.features.map((f) => "<li>" + esc(f) + "</li>").join("") + "</ul>" +
              (plan.note ? '<p class="plan-card__note">' + esc(plan.note) + "</p>" : "") +
              '<a class="btn btn--primary btn--sm plan-card__cta" data-wa data-wa-context="' + esc(wa) + '" data-analytics="click_whatsapp" href="' + waHref(wa) + '" target="_blank" rel="noopener">' + esc(planCta(fam, plan)) + "</a>" +
              "</div>"
            );
          })
          .join("");
        return (
          '<section class="catalog-family" id="' + fam.slug + '">' +
          '<header class="catalog-family__head">' +
          '<span class="catalog-family__ico" aria-hidden="true">' + iconSvg(fam.icon) + "</span>" +
          "<h2>" + esc(fam.name) + "</h2>" +
          "<p>" + esc(fam.summary) + "</p>" +
          "</header>" +
          '<div class="catalog-family__plans">' + plans + "</div>" +
          billingNoteHtml(fam) +
          '<div class="catalog-family__cta">' +
          '<a class="btn btn--primary" data-wa data-wa-context="' + esc(fam.waContext || "") + '" data-analytics="click_whatsapp" href="' + waHref(fam.waContext) + '" target="_blank" rel="noopener">' + esc(fam.ctaLabel || ("Falar sobre " + fam.name)) + "</a>" +
          (fam.demoUrl ? '<a class="btn btn--secondary" href="' + esc(fam.demoUrl) + '" target="_blank" rel="noopener" data-analytics="click_demo">Ver um exemplo</a>' : "") +
          "</div>" +
          "</section>"
        );
      })
      .join("");
  }

  /* ---- comparativo de cardápio (solucoes.html / precos.html) ---- */
  const cmp = document.getElementById("compareCardapio");
  const famC = P.families.find((f) => f.slug === "cardapio");
  if (cmp && famC && famC.compare) {
    const c = famC.compare;
    cmp.innerHTML =
      '<table class="compare-table"><thead><tr><th>Recurso</th>' +
      c.plans.map((p) => "<th>" + esc(p) + "</th>").join("") +
      "</tr></thead><tbody>" +
      c.rows
        .map((row, i) => {
          return (
            "<tr><th scope=\"row\">" + esc(row) + "</th>" +
            c.matrix.map((col) => "<td>" + (col[i] ? '<span class="yes">✓</span>' : '<span class="no">—</span>') + "</td>").join("") +
            "</tr>"
          );
        })
        .join("") +
      "</tbody></table>";
  }

  /* ---- programa Clientes Fundadores (só se habilitado) ---- */
  const fp = SB.founderProgram;
  const fSec = document.getElementById("fundadores");
  const fBlock = document.getElementById("foundersBlock");
  if (fp && fp.enabled && fSec && fBlock) {
    fSec.hidden = false;
    fBlock.innerHTML =
      '<span class="founders__eyebrow">Vagas limitadas</span>' +
      "<h2>" + esc(fp.headline) + "</h2>" +
      "<p>" + esc(fp.text) + "</p>" +
      '<ul class="founders__benefits">' + (fp.benefits || []).map((b) => "<li>" + esc(b) + "</li>").join("") + "</ul>" +
      (fp.limitNote ? '<p class="founders__limit">' + esc(fp.limitNote) + "</p>" : "") +
      '<a class="btn btn--primary" data-wa data-wa-context="founder" data-analytics="click_whatsapp" href="' + waHref("founder") + '" target="_blank" rel="noopener">Quero ser Cliente Fundador</a>';
  }

  /* ---- indique e ganhe ---- */
  const rf = SB.referral;
  const rSec = document.getElementById("indique");
  const rBlock = document.getElementById("referralBlock");
  if (rf && rf.enabled && rSec && rBlock) {
    rSec.hidden = false;
    rBlock.innerHTML =
      "<h2>" + esc(rf.title || "Indique e ganhe") + "</h2>" +
      "<p>" + esc(rf.text) + "</p>" +
      (rf.rulesNote ? '<p class="referral__note">' + esc(rf.rulesNote) + "</p>" : "") +
      '<a class="btn btn--secondary" data-wa data-wa-context="indicacao" data-analytics="click_whatsapp" href="' + waHref("indicacao") + '" target="_blank" rel="noopener">Quero indicar alguém</a>';
  }

  /* ---- posicionamento (item 1) ---- */
  const posEl = document.getElementById("positioning");
  if (posEl && SB.positioning) {
    const ps = SB.positioning;
    posEl.innerHTML =
      "<h2>" + esc(ps.headline) + "</h2>" +
      (ps.sub ? "<p>" + esc(ps.sub) + "</p>" : "") +
      (Array.isArray(ps.pillars) && ps.pillars.length
        ? '<ul class="positioning__pillars">' + ps.pillars.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ul>"
        : "");
  }

  /* ---- FAQ de preços (item 18) — configurável em data.js ---- */
  const faqEl = document.getElementById("faqList");
  if (faqEl && SB.faq && Array.isArray(SB.faq.items)) {
    faqEl.innerHTML = SB.faq.items
      .map(
        (it) =>
          "<details><summary>" + esc(it.q) + "</summary><p>" + esc(it.a) + "</p></details>"
      )
      .join("");
    try {
      const ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: SB.faq.items.map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: { "@type": "Answer", text: it.a },
        })),
      });
      document.head.appendChild(ld);
    } catch (e) {}
  }

  /* ---- depoimentos (só se houver) ---- */
  const tList = document.getElementById("testimonialList");
  const tSec = document.getElementById("depoimentos");
  if (tList && tSec && Array.isArray(SB.testimonials) && SB.testimonials.length) {
    tSec.hidden = false;
    tList.innerHTML = SB.testimonials
      .map(
        (t) =>
          '<li class="testimonial"><blockquote>' + esc(t.quote) + "</blockquote>" +
          '<p class="testimonial__by">' + esc(t.name) + (t.business ? " — " + esc(t.business) : "") + (t.city ? ", " + esc(t.city) : "") + "</p></li>"
      )
      .join("");
  }

  // re-aplica os hrefs de WhatsApp nos elementos recém-criados
  $$("[data-wa]").forEach((el) => el.setAttribute("href", waHref(el.getAttribute("data-wa-context"))));

  // JSON-LD OfferCatalog gerado a partir do data.js (sem duplicar preços no HTML)
  try {
    const offers = P.families.map((fam) => ({
      "@type": "Offer",
      name: fam.name,
      description: fam.summary,
      price: String(cheapest(fam).setup),
      priceCurrency: "BRL",
      url: "https://solutionsbinary.com.br/solucoes#" + fam.slug,
    }));
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      name: "Soluções Solutions Binary",
      itemListElement: offers,
    });
    document.head.appendChild(ld);
  } catch (e) {}
})();

/* -------------------------------------------------------------
   12. Barra de ação fixa no mobile (.mcta)
   Esconde quando a seção de contato está visível e quando o
   menu mobile está aberto.
   ------------------------------------------------------------- */
(function initStickyCta() {
  const bar = document.getElementById("mcta");
  if (!bar) return;

  function shown(on) {
    bar.classList.toggle("is-hidden", !on);
    document.body.classList.toggle("has-mcta", on);
  }
  shown(true);

  const contato = document.getElementById("contato");
  if (contato && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => shown(entry.intersectionRatio < 0.35));
      },
      { threshold: [0, 0.35, 1] }
    );
    io.observe(contato);
  }

  const burger = document.getElementById("navBurger");
  if (burger) {
    const mo = new MutationObserver(() => {
      if (burger.getAttribute("aria-expanded") === "true") shown(false);
    });
    mo.observe(burger, { attributes: true, attributeFilter: ["aria-expanded"] });
  }
})();
