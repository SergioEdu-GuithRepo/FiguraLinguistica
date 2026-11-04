-- FiguraLinguística — Esquema PostgreSQL / Supabase (Base de Dados na Nuvem)
-- Executa este script no SQL Editor do teu projecto Supabase (https://supabase.com/dashboard).

create table if not exists public.fl_accounts (
  id text primary key,
  email text not null unique,
  name text not null,
  salt text not null,
  password_hash text not null,
  token_hash text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at bigint not null default 0,
  created_at timestamptz not null default now()
);

-- Caso a tabela já tenha sido criada anteriormente com id uuid, converte para text sem perda:
alter table public.fl_accounts alter column id type text using id::text;

create index if not exists idx_fl_accounts_email on public.fl_accounts (email);
create index if not exists idx_fl_accounts_token_hash on public.fl_accounts (token_hash);

grant all on table public.fl_accounts to service_role;

-- Segurança Row-Level Security (RLS):
-- A API Next.js (/api/auth e /api/sync) acede com SUPABASE_SERVICE_ROLE_KEY.
alter table public.fl_accounts enable row level security;

drop policy if exists "Service role full access" on public.fl_accounts;
create policy "Service role full access"
  on public.fl_accounts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
