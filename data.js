/* =============================================================
   Solutions Binary — data.js
   Fonte única de verdade para posicionamento, preços, produtos,
   WhatsApp, programa de fundadores, FAQ e indicação.
   Editar SÓ este arquivo para mudar valores no site inteiro.
   Carregado antes de script.js (defer) em todas as páginas.
   ============================================================= */

window.SB = {
  /* ---------- Posicionamento comercial ---------- */
  positioning: {
    headline: "Comece pequeno. Evolua conforme seu negócio cresce.",
    sub: "Tecnologia profissional sem precisar começar com um projeto caro. Entrada acessível, mensalidade previsível e acompanhamento contínuo.",
    // pilares do que a mensalidade cobre — usados no bloco de posicionamento
    pillars: [
      "Implantação acessível",
      "Mensalidade previsível",
      "Suporte e manutenção",
      "Hospedagem e infraestrutura",
      "Atualizações e acompanhamento"
    ]
  },

  /* ---------- Contato / WhatsApp ---------- */
  whatsapp: {
    number: "5548999591614",
    email: "solutionsbinary4@gmail.com",
    default: "Olá! Vim pelo site da Solutions Binary e quero saber mais.",
    // Mensagens contextuais — usadas por [data-wa-context="chave"]
    messages: {
      demo:       "Olá! Quero uma demonstração da Solutions Binary baseada no meu negócio.",
      diagnostico:"Olá! Quero um diagnóstico gratuito. Tenho uma tarefa que dá trabalho e queria saber se dá pra facilitar.",
      cardapio:   "Olá! Quero meu Cardápio Digital com a Solutions Binary.",
      cardapioCompleto: "Olá! Quero o Cardápio Completo (carrinho e pedidos) da Solutions Binary.",
      cardapioIntegrado:"Olá! Quero integrar meu cardápio ao sistema do estabelecimento.",
      site:       "Olá! Quero meu site com a Solutions Binary.",
      siteProfissional: "Olá! Quero um site profissional com a Solutions Binary.",
      sitePremium:"Olá! Quero um site premium (com área administrativa/painel) com a Solutions Binary.",
      automacao:  "Olá! Tenho uma tarefa que gostaria de automatizar.",
      whatsappIa: "Olá! Quero automatizar meu WhatsApp com a Solutions Binary.",
      whatsappIaAvancado:"Olá! Quero o WhatsApp com IA da Solutions Binary.",
      dashboard:  "Olá! Quero um dashboard para acompanhar os números do meu negócio.",
      custom:     "Olá! Tenho um problema específico e queria contar para a Solutions Binary.",
      restaurante:"Olá! Tenho um restaurante/lanchonete e quero ver as soluções da Solutions Binary.",
      comercio:   "Olá! Tenho um comércio local e quero saber como a Solutions Binary pode ajudar.",
      founder:    "Olá! Quero ser Cliente Fundador da Solutions Binary.",
      indicacao:  "Olá! Quero indicar uma empresa para a Solutions Binary."
    }
  },

  /* ---------- Preços e produtos ----------
     Cada família tem 1+ planos. Campos de preço:
       setup            implantação (R$)
       setupFrom        true  -> exibe "a partir de"
       monthly          mensalidade fixa (R$)
       monthlyOptional  mensalidade só se houver infra/monitoramento
       monthlyRange     [min,max]  faixa de mensalidade
     ctaLabel na família é o CTA principal; ctaLabel no plano
     sobrepõe para aquele plano específico.
  */
  pricing: {
    note: "Os valores podem variar conforme a complexidade do projeto.",
    families: [
      {
        slug: "site",
        name: "Site",
        icon: "site",
        summary: "Um site profissional, rápido no celular, com WhatsApp — no ar em poucos dias.",
        ctaLabel: "Quero meu site",
        waContext: "site",
        demoUrl: "https://www.imperiotenis.com.br",
        plans: [
          {
            name: "Site Essencial",
            tag: "Para começar",
            setup: 397, monthly: 49,
            ctaLabel: "Quero meu site",
            waContext: "site",
            features: [
              "1 página", "Até 6 seções", "Responsivo (ótimo no celular)",
              "Botão de WhatsApp", "Apresentação da empresa", "Página de serviços",
              "Contato", "Certificado SSL", "Hospedagem", "Manutenção básica"
            ]
          },
          {
            name: "Site Profissional",
            setup: 697, monthly: 69,
            ctaLabel: "Quero um site profissional",
            waContext: "siteProfissional",
            features: [
              "Visual personalizado", "Mais seções", "Portfólio", "Galeria",
              "Formulários", "Animações", "SEO básico", "Integração com WhatsApp",
              "Hospedagem", "Manutenção"
            ]
          },
          {
            name: "Site Premium",
            setup: 997, setupFrom: true, monthly: 99,
            ctaLabel: "Quero um site premium",
            waContext: "sitePremium",
            note: "Valor final depende da complexidade.",
            features: [
              "Área administrativa", "Banco de dados", "Login",
              "Funcionalidades específicas", "Integrações", "Catálogo",
              "Painel", "Automações"
            ]
          }
        ]
      },

      {
        slug: "cardapio",
        name: "Cardápio Digital",
        icon: "cardapio",
        summary: "Seu cardápio sempre atualizado sem precisar refazer arte. Você mantém um sistema funcionando todos os dias.",
        featured: true,
        ctaLabel: "Quero meu cardápio",
        waContext: "cardapio",
        demoUrl: "https://trufasdade.netlify.app",
        plans: [
          {
            name: "Cardápio Essencial",
            tag: "Para começar",
            setup: 297, monthly: 149,
            ctaLabel: "Quero meu cardápio",
            waContext: "cardapio",
            features: [
              "Catálogo digital", "Categorias", "Produtos", "Preços", "QR Code",
              "Botão de WhatsApp", "Painel administrativo",
              "Alterar preços quando quiser", "Alterar produtos",
              "Marcar item como esgotado", "Hospedagem", "Banco de dados",
              "Suporte", "Manutenção"
            ]
          },
          {
            name: "Cardápio Completo",
            tag: "Mais escolhido",
            featured: true,
            setup: 397, monthly: 179,
            ctaLabel: "Quero o completo",
            waContext: "cardapioCompleto",
            features: [
              "Tudo do Cardápio Essencial", "Carrinho", "Adicionais", "Checkout",
              "Pedidos", "Formas de pagamento", "Histórico de pedidos",
              "Personalização", "Painel administrativo completo"
            ]
          },
          {
            name: "Cardápio Integrado",
            setup: 690, monthly: 249,
            ctaLabel: "Quero integrar meu cardápio",
            waContext: "cardapioIntegrado",
            note: "A integração depende da compatibilidade e da documentação do sistema utilizado pelo estabelecimento.",
            features: [
              "Tudo do Cardápio Completo",
              "Integração com o sistema do estabelecimento",
              "Integração com PDV quando possível",
              "Impressão automática de pedidos", "Integrações com API",
              "Automações", "Monitoramento"
            ]
          }
        ],
        billingNote: {
          title: "O cardápio continua funcionando por você",
          intro: "A mensalidade inclui:",
          items: [
            "Hospedagem", "Banco de dados", "Painel administrativo", "Manutenção",
            "Backup", "Suporte", "Atualizações", "Correções", "Infraestrutura",
            "Monitoramento"
          ],
          message: "Você não paga apenas por uma página. Você mantém um sistema funcionando todos os dias."
        },
        compare: {
          plans: ["Essencial", "Completo", "Integrado"],
          rows: [
            "Catálogo digital", "QR Code", "Painel administrativo",
            "Alterar preços e produtos", "Marcar item esgotado",
            "Carrinho e checkout", "Pedidos", "Histórico de pedidos",
            "Integração com PDV", "Impressão automática"
          ],
          matrix: [
            [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
          ]
        }
      },

      {
        slug: "automacao",
        name: "Automação",
        icon: "automacao",
        summary: "Planilha vira e-mail, formulário vira banco, relatório sai pronto — o repetitivo no piloto automático.",
        featured: true,
        ctaLabel: "Quero automatizar",
        waContext: "automacao",
        plans: [
          {
            name: "Automação Express",
            tag: "Para começar",
            setup: 297, setupFrom: true, monthlyOptional: 99,
            ctaLabel: "Quero automatizar",
            waContext: "automacao",
            note: "A mensalidade só existe quando a automação depende da nossa infraestrutura.",
            features: [
              "Planilha → e-mail", "Formulário → banco de dados",
              "Geração de relatório", "Notificações", "Tarefas repetitivas",
              "Integrações simples"
            ]
          },
          {
            name: "Automação Personalizada",
            setup: 497, setupFrom: true, monthlyRange: [99, 249],
            ctaLabel: "Quero uma automação sob medida",
            waContext: "automacao",
            note: "Projetos médios ficam entre R$ 497 e R$ 997. Projetos maiores partem de R$ 990. A mensalidade se aplica quando há servidor, APIs, banco de dados, integrações e monitoramento.",
            features: [
              "Servidor", "Monitoramento", "APIs", "Banco de dados",
              "Integrações", "Manutenção"
            ]
          }
        ]
      },

      {
        slug: "whatsapp",
        name: "WhatsApp Inteligente",
        icon: "whatsapp",
        summary: "Atendimento inicial, respostas e direcionamento — com IA quando fizer sentido.",
        ctaLabel: "Automatizar meu WhatsApp",
        waContext: "whatsappIa",
        plans: [
          {
            name: "WhatsApp Inteligente",
            tag: "Recomendado",
            setup: 697, monthly: 149,
            ctaLabel: "Automatizar meu WhatsApp",
            waContext: "whatsappIa",
            features: [
              "Respostas automáticas", "Captação de informações",
              "Fluxos de atendimento", "Organização das conversas",
              "Automação", "Integração básica"
            ]
          },
          {
            name: "WhatsApp + IA",
            advanced: true,
            setup: 997, setupFrom: true, monthly: 249,
            ctaLabel: "Quero o WhatsApp com IA",
            waContext: "whatsappIaAvancado",
            note: "Consumo extraordinário de APIs pode ser cobrado separadamente.",
            features: [
              "Inteligência artificial", "Interpretação de mensagens",
              "Classificação automática", "Respostas com IA",
              "Integração com banco de dados", "Automações", "Captação de leads"
            ]
          }
        ]
      },

      {
        slug: "dashboard",
        name: "Dashboard",
        icon: "dashboard",
        summary: "Suas planilhas e dados viram informação simples de acompanhar.",
        ctaLabel: "Quero um dashboard",
        waContext: "dashboard",
        demoUrl: "https://portal-atlanta-react.vercel.app",
        plans: [
          {
            name: "Dashboard Essencial",
            setup: 397, setupFrom: true,
            ctaLabel: "Quero um dashboard",
            waContext: "dashboard",
            features: [
              "Painel visual", "Indicadores", "Gráficos", "Dados de planilhas"
            ]
          },
          {
            name: "Dashboard Automatizado",
            setup: 697, setupFrom: true, monthlyOptional: 99,
            ctaLabel: "Quero um dashboard automático",
            waContext: "dashboard",
            note: "A mensalidade se aplica quando os dados são atualizados automaticamente.",
            features: [
              "Tudo do Dashboard Essencial", "Atualização automática dos dados",
              "Integração com sistemas", "Monitoramento"
            ]
          }
        ]
      },

      {
        slug: "custom",
        name: "Solução sob medida",
        icon: "custom",
        summary: "Tem um problema específico? Mostre para a gente. Sem sistema gigante.",
        ctaLabel: "Contar meu problema",
        waContext: "custom",
        plans: [
          {
            name: "Solução sob medida",
            setup: 497, setupFrom: true,
            ctaLabel: "Contar meu problema",
            waContext: "custom",
            features: [
              "Levantamento do problema", "Solução pequena e direta",
              "Controle interno, formulário ou painel", "Sem sistema gigante"
            ]
          }
        ]
      }
    ]
  },

  /* ---------- Explicação implantação × mensalidade ---------- */
  billing: {
    title: "Por que existe implantação + mensalidade?",
    setup: "A implantação cobre a criação e a configuração inicial do projeto.",
    monthly: "A mensalidade mantém tudo funcionando e pode incluir:",
    monthlyItems: [
      "Hospedagem", "Banco de dados", "Backups", "Monitoramento",
      "Suporte", "Manutenção", "Atualizações", "Infraestrutura",
      "Acompanhamento"
    ],
    domain: "Nos sites, o domínio pode ser contratado por você ou administrado pela Solutions Binary. O custo do domínio não entra na mensalidade sem estar especificado."
  },

  /* ---------- Perguntas frequentes sobre preços ----------
     Termos configuráveis. Não inventar regras rígidas.
  */
  faq: {
    title: "Perguntas frequentes sobre preços",
    items: [
      {
        q: "Por que existe mensalidade?",
        a: "A mensalidade mantém o projeto no ar: hospedagem, infraestrutura, banco de dados, backups, monitoramento, suporte, manutenção e pequenas correções. Você não paga só por uma entrega — você mantém algo funcionando todos os dias."
      },
      {
        q: "Posso cancelar?",
        a: "As condições de permanência e de cancelamento são combinadas no início do projeto, de forma clara e por escrito."
      },
      {
        q: "O domínio está incluso?",
        a: "O domínio pode ser contratado por você ou administrado pela Solutions Binary. O custo do domínio não entra na mensalidade sem estar especificado."
      },
      {
        q: "A hospedagem está inclusa?",
        a: "Sim. Nos planos com mensalidade, a hospedagem e a infraestrutura estão inclusas."
      },
      {
        q: "Vocês fazem alterações?",
        a: "Sim. Pequenos ajustes entram na manutenção. Mudanças maiores são orçadas à parte, sempre combinadas antes de começar."
      },
      {
        q: "Existe suporte?",
        a: "Sim. Nos planos recorrentes, o suporte faz parte da mensalidade."
      },
      {
        q: "A mensalidade aumenta?",
        a: "Qualquer reajuste é comunicado com antecedência e combinado com você. Não há aumento sem aviso."
      },
      {
        q: "O que acontece se eu parar de pagar?",
        a: "O serviço fica pausado até a regularização. As regras de suspensão e retomada são combinadas no contrato, sem surpresa."
      }
    ]
  },

  /* ---------- Programa Clientes Fundadores ----------
     enabled: true -> a seção é renderizada em index.html.
     discounts vazio -> mostra só o convite do programa, sem
     preços riscados. Preencher quando os valores forem definidos.
  */
  founderProgram: {
    enabled: true,
    headline: "Programa Clientes Fundadores",
    text: "Estamos formando nossa primeira base de clientes. Quem entra agora ajuda a moldar as soluções e recebe condições exclusivas.",
    benefits: [
      "Implantação com valor especial",
      "Mensalidade promocional",
      "Atendimento próximo",
      "Prioridade no suporte",
      "Condições exclusivas para os primeiros clientes"
    ],
    limitNote: "Condição válida para os primeiros clientes.",
    discounts: {
      // "cardapio:Cardápio Essencial": { normalSetup: 297, founderSetup: 197, monthly: 149 }
    }
  },

  /* ---------- Programa de indicação ---------- */
  referral: {
    enabled: true,
    title: "Indique e ganhe",
    text: "Indicou uma empresa que fechou conosco? Você pode ganhar desconto ou uma mensalidade.",
    rulesNote: "Regras combinadas caso a caso."
  },

  /* ---------- Prova social ----------
     Vazio -> a seção de depoimentos não aparece. Não inventar.
     Formato: { quote, name, business, city }
  */
  testimonials: []
};
