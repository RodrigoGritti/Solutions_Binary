/* =============================================================
   Solutions Binary — script.js
   Nav mobile · scroll reveal · FAB WhatsApp · formulário + Supabase
   Sem framework, sem build step.
   ============================================================= */

/* -------------------------------------------------------------
   CONFIGURAÇÃO — ajuste estas 3 constantes e o site está pronto
   ------------------------------------------------------------- */

const WHATSAPP_NUMBER = "5548999591614";

// TODO: substituir pela URL real do projeto Supabase (ex.: https://xxxxxxxx.supabase.co)
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";

// TODO: substituir pela anon key real do projeto Supabase
const SUPABASE_ANON_KEY = "SUA_ANON_KEY_AQUI";

/* Mensagem pré-preenchida ao abrir o WhatsApp */
const WHATSAPP_MESSAGE =
  "Olá! Vim pelo site e quero saber mais sobre as soluções da Solutions Binary.";

/* Biblioteca do Supabase carregada sob demanda (ESM, sem bundler) */
const SUPABASE_ESM_URL = "https://esm.sh/@supabase/supabase-js@2";

/* -------------------------------------------------------------
   Helpers
   ------------------------------------------------------------- */
const $ = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------------------
   1. Links de WhatsApp (fonte da verdade: WHATSAPP_NUMBER)
   ------------------------------------------------------------- */
(function initWhatsappLinks() {
  const href =
    "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
  $$("[data-wa]").forEach((el) => {
    el.setAttribute("href", href);
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
    submitLabel.textContent = on ? "Enviando..." : "Enviar mensagem";
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

    if (!isConfigured()) {
      // Sem banco de dados configurado ainda: manda os dados preenchidos
      // direto pro WhatsApp cadastrado, em vez de simplesmente falhar.
      const nome = fields.nome.value.trim();
      const telefone = fields.telefone.value.trim();
      const servico = fields.servico.value;
      const mensagem = fields.mensagem.value.trim();

      let texto =
        "Olá! Meu nome é " + nome + " e vim pelo site da Solutions Binary.\n" +
        "Tenho interesse em: " + servico + ".\n" +
        "Meu telefone: " + telefone + ".";
      if (mensagem) texto += "\n\n" + mensagem;

      const waHref = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(texto);
      window.open(waHref, "_blank", "noopener");

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
        telefone: fields.telefone.value.trim(),
        servico_interesse: fields.servico.value,
        mensagem: fields.mensagem.value.trim() || null,
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

  const CATS = {
    website: { label: "Website", extraLabel: "Tipo de site", extraOptions: ["Institucional", "Loja virtual", "Portfólio"] },
    cardapio: { label: "Cardápio digital", extraLabel: "Tipo de cardápio", extraOptions: ["Restaurante", "Doceria", "Marmitaria", "Lanchonete"] },
    automacao: { label: "Automação", extraLabel: "Canal principal", extraOptions: ["WhatsApp", "Instagram", "E-mail"] },
    processos: { label: "Gestão de processos", extraLabel: "O que quer controlar", extraOptions: ["Estoque", "Agendamentos", "Pedidos", "Documentos"] },
    dashboards: { label: "Dashboards e BI", extraLabel: "Área que quer acompanhar", extraOptions: ["Vendas", "Financeiro", "Operação", "Marketing"] },
  };

  const CARDAPIO_ITEMS = {
    "Restaurante": [["Prato executivo", "Feito na hora", "32,90"], ["Combo do dia", "Entrada + prato + sobremesa", "45,00"], ["Sobremesa da casa", "Receita própria", "14,50"]],
    "Doceria": [["Brigadeiro gourmet", "Caixa com 6 un.", "28,00"], ["Bolo no pote", "Sabor do dia", "16,90"], ["Caixa surpresa", "Seleção especial", "39,90"]],
    "Marmitaria": [["Marmita fitness", "300g, low carb", "24,90"], ["Marmita tradicional", "Arroz, feijão e carne", "19,90"], ["Combo família", "Serve até 4 pessoas", "69,90"]],
    "Lanchonete": [["Combo lanche", "Lanche + batata + bebida", "28,90"], ["Batata especial", "Com cheddar e bacon", "18,00"], ["Milkshake", "Vários sabores", "14,90"]],
  };

  function mockWebsite({ nome, ramo, extra, logoUrl }) {
    const n = escapeHtml(nome), r = escapeHtml(ramo.toLowerCase()), t = escapeHtml(extra.toLowerCase());
    return `<div class="mock-site">
      <div class="mock-site__nav">
        <span class="mock-site__logo">${logoUrl ? `<img src="${logoUrl}" alt="">` : ""}${n}</span>
        <span class="mock-site__navlink">Início</span>
        <span class="mock-site__navlink">Serviços</span>
        <span class="mock-site__cta">Fale conosco</span>
      </div>
      <div class="mock-site__hero">
        <h3>${n} — ${t} feito sob medida</h3>
        <p>Presença online profissional para o seu ${r}.</p>
        <span class="mock-site__btn">Começar agora</span>
      </div>
      <div class="mock-site__features">
        <div class="mock-site__feature"></div><div class="mock-site__feature"></div><div class="mock-site__feature"></div>
      </div>
    </div>`;
  }

  function mockCardapio({ nome, extra, logoUrl }) {
    const items = CARDAPIO_ITEMS[extra] || CARDAPIO_ITEMS["Restaurante"];
    const itemsHtml = items.map(([n, d, p]) => `
      <div class="mock-cardapio__item">
        <span class="mock-cardapio__thumb"></span>
        <div><strong>${escapeHtml(n)}</strong><small>${escapeHtml(d)}</small></div>
        <span class="mock-cardapio__price">R$ ${p}</span>
      </div>`).join("");
    return `<div class="mock-cardapio">
      <div class="mock-cardapio__head">
        <span class="mock-cardapio__logo">${logoUrl ? `<img src="${logoUrl}" alt="">` : escapeHtml(initialOf(nome))}</span>
        <div><strong>${escapeHtml(nome)}</strong><small>${escapeHtml(extra)}</small></div>
      </div>
      <div class="mock-cardapio__items">${itemsHtml}</div>
      <span class="mock-cardapio__cta">Pedir no WhatsApp</span>
    </div>`;
  }

  function mockAutomacao({ nome, ramo, extra }) {
    const bubbles = [
      { in: true, text: `Olá! Vim pelo ${extra} e queria saber se vocês atendem ${ramo.toLowerCase()}.` },
      { in: false, text: `Oi! Sim, atendemos sim 😊 Sou o assistente virtual da ${nome}. Como posso te ajudar hoje?` },
      { in: true, text: "Queria saber os horários e como faço pra agendar." },
      { in: false, text: "Consigo te passar tudo certinho agora mesmo, sem precisar esperar um atendente 👍" },
    ];
    const bubblesHtml = bubbles.map((b) => `<div class="mock-wa__bubble mock-wa__bubble--${b.in ? "in" : "out"}">${escapeHtml(b.text)}</div>`).join("");
    return `<div class="mock-wa">
      <div class="mock-wa__head">
        <span class="mock-wa__avatar">${escapeHtml(initialOf(nome))}</span>
        <div><strong>${escapeHtml(nome)}</strong><small>online</small></div>
      </div>
      <div class="mock-wa__body">${bubblesHtml}</div>
    </div>`;
  }

  function mockProcessos({ nome, extra }) {
    return `<div class="mock-kanban">
      <div class="mock-kanban__head"><strong>${escapeHtml(nome)}</strong><small>Controle de ${escapeHtml(extra.toLowerCase())}</small></div>
      <div class="mock-kanban__cols">
        <div class="mock-kanban__col"><h4>Pendente</h4><span class="mock-kanban__card"></span><span class="mock-kanban__card"></span></div>
        <div class="mock-kanban__col"><h4>Em andamento</h4><span class="mock-kanban__card"></span></div>
        <div class="mock-kanban__col"><h4>Concluído</h4><span class="mock-kanban__card"></span><span class="mock-kanban__card"></span></div>
      </div>
    </div>`;
  }

  function mockDashboards({ nome, extra }) {
    return `<div class="mock-dash">
      <div class="mock-dash__head"><strong>${escapeHtml(nome)}</strong><small>Painel de ${escapeHtml(extra.toLowerCase())}</small></div>
      <div class="mock-dash__kpis">
        <div class="mock-dash__kpi"><span>128</span><small>Pedidos</small></div>
        <div class="mock-dash__kpi"><span>R$ 12,4k</span><small>Faturamento</small></div>
        <div class="mock-dash__kpi"><span>+18%</span><small>Crescimento</small></div>
      </div>
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = nomeInput.value.trim();
    const ramo = ramoInput.value.trim();
    if (!nome) { nomeInput.focus(); return; }
    if (!ramo) { ramoInput.focus(); return; }
    const extra = extraSelect.value;

    showStep("loading");

    const delay = prefersReducedMotion() ? 150 : 1500;
    window.setTimeout(() => {
      frame.style.setProperty("--pv", state.color);
      mockEl.innerHTML = MOCK_BUILDERS[state.cat]({ nome, ramo, extra, logoUrl: state.logoUrl });

      const texto = `Olá! Testei a prévia de "${CATS[state.cat].label}" no site (empresa: ${nome}, ramo: ${ramo}) e quero saber mais sobre como isso ficaria pra mim de verdade.`;
      waLink.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(texto));

      showStep("result");
      frame.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    }, delay);
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
