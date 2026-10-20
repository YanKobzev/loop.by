create table if not exists public.buyback_leads (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 reference text not null unique,
 payload jsonb not null,
 consent boolean not null check (consent),
 notification_status text not null default 'pending' check (notification_status in ('pending', 'sent')),
 quote_amount numeric(12,2) check (quote_amount >= 0),
 quote_comment text
);
alter table public.buyback_leads enable row level security;
-- No public read or write policies. Only the server secret key may access leads.
