/* =============================================================
   Solutions Binary — data.js
   Fonte única de verdade para preços, produtos, WhatsApp,
   programa de fundadores e indicação.
   Editar SÓ este arquivo para mudar valores no site inteiro.
   Carregado antes de script.js (defer) em todas as páginas.
   ============================================================= */

window.SB = {
  /* ---------- Contato / WhatsApp ---------- */
  whatsapp: {
    number: "5548999591614",
    email: "solutionsbinary4@gmail.com",
    default: "Olá! Vim pelo site da Solutions Binary e quero saber mais.",
    // Mensagens contextuais — usadas por [data-wa-context="chave"]
    messages: {
      demo:       "Olá! Quero uma demonstração da Solutions Binary.",
      diagnostico:"Olá! Quero um diagnóstico gratuito. Tenho uma tarefa que dá trabalho e queria saber se dá pra facilitar.",
      cardapio:   "Olá! Vi o Cardápio Digital da Solutions Binary e gostaria de entender como funciona.",
      site:       "Olá! Gostaria de saber mais sobre o Site Express da Solutions Binary.",
      automacao:  "Olá! Tenho uma tarefa que gostaria de automatizar.",
      whatsappIa: "Olá! Quero saber como funciona o WhatsApp Inteligente da Solutions Binary.",
      dashboard:  "Olá! Quero um Dashboard para acompanhar os números do meu negócio.",
      custom:     "Olá! Tenho um problema específico e queria contar para a Solutions Binary.",
      restaurante:"Olá! Tenho um restaurante/lanchonete e quero ver as soluções da Solutions Binary.",
      comercio:   "Olá! Tenho um comércio local e quero saber como a Solutions Binary pode ajudar.",
      founder:    "Olá! Quero ser Cliente Fundador da Solutions Binary.",
      indicacao:  "Olá! Quero indicar uma empresa para a Solutions Binary."
    }
  },

  /* ---------- Preços e produtos ----------
     Cada família tem 1+ planos. Campos de preço:
       setup        implantação (R$)
       setupFrom    true  -> exibe "a partir de"
       monthly      mensalidade fixa (R$)
       monthlyOptional  mensalidade só se houver infra/monitoramento
       monthlyRange [min,max]  faixa de mensalidade
  */
  pricing: {
    note: "Os valores podem variar conforme a complexidade do projeto.",
    families: [
      {
        slug: "cardapio",
        name: "Cardápio Digital",
        icon: "cardapio",
        summary: "Um cardápio bonito, rápido e fácil de atualizar pelo celular ou computador.",
        featured: true,
        waContext: "cardapio",
        demoUrl: "https://trufasdade.netlify.app",
        plans: [
          {
            name: "Cardápio Digital",
            tag: "Para começar",
            setup: 490, monthly: 79,
            features: [
              "Catálogo digital", "Categorias e produtos", "Preços",
              "QR Code", "Botão de WhatsApp", "Painel administrativo",
              "Marcar produtos esgotados", "Atualização sem refazer o cardápio"
            ]
          },
          {
            name: "Cardápio Completo",
            setup: 790, monthly: 129,
            features: [
              "Tudo do Cardápio Digital", "Carrinho", "Adicionais",
              "Checkout", "Pedidos", "Formas de pagamento",
              "Status dos produtos", "QR Code e WhatsApp", "Hospedagem"
            ]
          },
          {
            name: "Cardápio + Integração",
            setup: 1500, setupFrom: true, monthly: 199,
            note: "Valor final depende do sistema utilizado pelo estabelecimento.",
            features: [
              "Integração com PDV", "Impressão de pedidos",
              "Sistema do estabelecimento", "Pedidos automáticos",
              "Integrações personalizadas"
            ]
          }
        ],
        compare: {
          plans: ["Digital", "Completo", "Integrado"],
          rows: ["Catálogo digital", "QR Code", "Painel administrativo", "Carrinho", "Pedidos", "Integração com PDV", "Impressão"],
          matrix: [
            [1, 1, 1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 1, 1]
          ]
        }
      },

      {
        slug: "site",
        name: "Site",
        icon: "site",
        summary: "Um site profissional, rápido no celular, com WhatsApp e domínio próprio.",
        waContext: "site",
        demoUrl: "https://www.imperiotenis.com.br",
        plans: [
          {
            name: "Site Express",
            tag: "Para começar",
            setup: 790, monthly: 79,
            features: [
              "Site profissional", "Ótimo no celular", "Botão de WhatsApp",
              "Formulário de contato", "Domínio personalizado", "Hospedagem",
              "Certificado SSL", "Manutenção básica"
            ]
          },
          {
            name: "Site Profissional",
            setup: 1290, monthly: 99,
            features: [
              "Múltiplas páginas", "Portfólio", "Página de serviços",
              "Galerias", "Formulários", "SEO básico", "Animações",
              "Integração com WhatsApp", "Painel quando necessário"
            ]
          }
        ]
      },

      {
        slug: "automacao",
        name: "Automação",
        icon: "automacao",
        summary: "Tem uma tarefa que você faz todo dia? Talvez ela possa ser automática.",
        featured: true,
        waContext: "automacao",
        plans: [
          {
            name: "Automação Express",
            tag: "Para começar",
            setup: 490, setupFrom: true, monthlyOptional: 99,
            note: "Mensalidade só quando precisa de infraestrutura e monitoramento.",
            features: [
              "Formulário → planilha", "E-mail automático", "Relatórios",
              "Notificações", "Organização de dados", "Integrar ferramentas",
              "Processos repetitivos"
            ]
          },
          {
            name: "Automação Personalizada",
            setup: 990, setupFrom: true, monthlyRange: [149, 249],
            note: "Mensalidade quando há servidor, APIs, banco de dados e monitoramento.",
            features: [
              "Automações maiores", "Servidor dedicado", "APIs",
              "Monitoramento", "Banco de dados", "Integrações recorrentes"
            ]
          }
        ]
      },

      {
        slug: "whatsapp",
        name: "WhatsApp Inteligente",
        icon: "whatsapp",
        summary: "Atendimento inicial, respostas e direcionamento — com IA quando fizer sentido.",
        waContext: "whatsappIa",
        plans: [
          {
            name: "WhatsApp Inteligente",
            tag: "Recomendado",
            setup: 990, monthly: 197,
            note: "Consumo extraordinário de APIs poderá ser cobrado separadamente.",
            features: [
              "Atendimento inicial", "Respostas automáticas", "Captação de informações",
              "Direcionamento", "Integração com sistema", "Automações",
              "Inteligência artificial"
            ]
          },
          {
            name: "WhatsApp + IA Avançado",
            advanced: true,
            setup: 1990, monthly: 397,
            features: [
              "Fluxos avançados", "IA aprofundada no atendimento",
              "Integrações sob medida", "Acompanhamento próximo"
            ]
          }
        ]
      },

      {
        slug: "dashboard",
        name: "Dashboard",
        icon: "dashboard",
        summary: "Suas planilhas e dados viram informação simples de acompanhar.",
        waContext: "dashboard",
        demoUrl: "https://portal-atlanta-react.vercel.app",
        plans: [
          {
            name: "Dashboard",
            setup: 690, setupFrom: true, monthlyOptional: 99,
            note: "Plano mensal quando precisa de atualização automática dos dados.",
            features: [
              "Vendas", "Despesas", "Estoque", "Pedidos", "Metas", "Indicadores"
            ]
          }
        ]
      },

      {
        slug: "custom",
        name: "Solução sob medida",
        icon: "custom",
        summary: "Tem um problema específico? Conte para a gente. Sem sistema gigante.",
        waContext: "custom",
        plans: [
          {
            name: "Solução sob medida",
            setup: 990, setupFrom: true,
            features: [
              "Levantamento do problema", "Solução pequena e direta",
              "Controle interno, formulário ou painel", "Sem sistema gigante"
            ]
          }
        ]
      }
    ]
  },

  /* ---------- Explicação implantação × mensalidade (item 18) ---------- */
  billing: {
    title: "Por que existe implantação + mensalidade?",
    setup: "A implantação cobre a criação e a configuração inicial do projeto.",
    monthly: "A mensalidade pode incluir:",
    monthlyItems: [
      "Hospedagem", "Banco de dados", "Backups", "Monitoramento",
      "Pequenas correções", "Manutenção", "Infraestrutura"
    ],
    domain: "Nos sites, o domínio pode ser contratado por você ou administrado pela Solutions Binary. O custo do domínio não entra na mensalidade sem estar especificado."
  },

  /* ---------- Programa Clientes Fundadores (itens 19-20) ----------
     enabled: false  -> a seção não é renderizada e nenhum preço
     "fundador" aparece. Ligar só quando os valores estiverem definidos.
     discounts: aplica SÓ nas chaves listadas ("slug:Nome do plano").
  */
  founderProgram: {
    enabled: false,
    headline: "Clientes Fundadores Solutions Binary",
    text: "Estamos selecionando os primeiros negócios parceiros da Solutions Binary.",
    benefits: [
      "Implantação com valor especial",
      "Mensalidade promocional",
      "Atendimento próximo",
      "Prioridade em melhorias",
      "Participação no desenvolvimento das soluções"
    ],
    limitNote: "Condição limitada aos primeiros clientes.",
    discounts: {
      // "cardapio:Cardápio Digital": { normalSetup: 790, founderSetup: 490, monthly: 79 }
    }
  },

  /* ---------- Programa de indicação (item 34) ---------- */
  referral: {
    enabled: true,
    title: "Indique e ganhe",
    text: "Indicou uma empresa que fechou conosco? Você pode ganhar desconto ou uma mensalidade.",
    rulesNote: "Regras combinadas caso a caso."
  },

  /* ---------- Prova social (item 32) ----------
     Vazio -> a seção de depoimentos não aparece. Não inventar.
     Formato: { quote, name, business, city }
  */
  testimonials: []
};
