-- Solutions Binary — tabela de sessões do robô de WhatsApp
-- Rodar uma vez no SQL Editor do projeto Supabase escolhido.
-- Guarda o estado de cada conversa (histórico, modo bot/humano) pra
-- sobreviver a reinícios do servidor (deploy no Render, ou o plano
-- grátis "dormindo" por inatividade).

create table if not exists public.bot_sessions (
  phone                    text primary key,
  history                  jsonb not null default '[]'::jsonb,
  mode                     text not null default 'bot',
  human_until              bigint not null default 0,
  last_human_reminder_at   bigint not null default 0,
  welcomed                 boolean not null default false,
  updated_at               timestamptz not null default now()
);

-- RLS ligado, sem policies: só a service_role key (usada pelo servidor,
-- que ignora RLS) lê/escreve aqui — mesmo padrão dos outros projetos
-- Supabase da Solutions Binary.
alter table public.bot_sessions enable row level security;
