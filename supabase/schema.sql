-- Run once in the Supabase SQL editor. All application data is server-only.
create table if not exists public.cv_sessions (
  id text primary key,
  revision integer not null default 0,
  state jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.cv_sessions enable row level security;
revoke all on public.cv_sessions from anon, authenticated;
create table if not exists public.cv_ai_budget (
  day date primary key,
  requests integer not null default 0
);
alter table public.cv_ai_budget enable row level security;
revoke all on public.cv_ai_budget from anon, authenticated;
create or replace function public.cv_reserve_ai_request(daily_limit integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if daily_limit < 1 then return false; end if;
  insert into cv_ai_budget(day,requests) values ((now() at time zone 'UTC')::date,1)
  on conflict(day) do update set requests=cv_ai_budget.requests+1 where cv_ai_budget.requests < daily_limit
  returning requests into n;
  return n is not null;
end;
$$;
revoke all on function public.cv_reserve_ai_request(integer) from public, anon, authenticated;
grant execute on function public.cv_reserve_ai_request(integer) to service_role;
