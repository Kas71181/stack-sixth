-- OAuth token vault for Stack Sixth custom connector flows.
-- Access is service-role only: RLS enabled with no policies.
create table if not exists public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  app_user_id text not null,
  provider text not null,
  provider_workspace_id text,
  authed_provider_user_id text,
  encrypted_token text not null,
  token_iv text not null,
  token_type text not null default 'user',
  scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_user_id, provider)
);

alter table public.oauth_connections enable row level security;
