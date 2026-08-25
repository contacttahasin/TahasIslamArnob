-- ============================================================
-- Reviews — run this ONCE in the Supabase SQL Editor.
--
--   Dashboard → SQL Editor → New query → paste all of this → Run
--
-- Safe to re-run: every statement is idempotent. This is the reviews half
-- of supabase/schema.sql, split out so it is quick to paste and any error
-- points at something small.
-- ============================================================

create extension if not exists pgcrypto;

-- ── 1. Who the owner is ─────────────────────────────────────
-- Visitors can now sign in with Google to leave a review, so "authenticated"
-- no longer means "the owner" — it means anyone with a Google account. The
-- owner-only policies below therefore name the owner explicitly.

create table if not exists public.app_owner (
  email text primary key
);

-- RLS on with no policies: nothing reads this through the API. Only
-- is_owner() can see it, because a security-definer function runs with the
-- definer's rights.
alter table public.app_owner enable row level security;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_owner where email = (auth.jwt() ->> 'email')
  );
$$;

-- YOUR login email — must match OWNER_EMAIL in .env.local.
insert into public.app_owner (email)
values ('contact.tahasin@gmail.com')
on conflict (email) do nothing;

-- ── 2. The reviews table ────────────────────────────────────

do $$ begin
  create type review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null default '',
  company text not null default '',
  text text not null,
  -- Owner-set avatar: an uploaded media URL or a pasted link.
  picture text,
  -- Set when a visitor submitted while signed in with Google. Name and
  -- picture are copied from that account server-side. The address itself is
  -- never stored: reads here are public, so anything kept is published.
  author_id uuid references auth.users (id) on delete set null,
  author_avatar text,
  link text,
  rating smallint check (rating is null or (rating between 1 and 5)),
  status review_status not null default 'pending',
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- For databases created by an earlier version of this file.
alter table public.reviews add column if not exists author_id uuid references auth.users (id) on delete set null;
alter table public.reviews add column if not exists author_avatar text;
alter table public.reviews drop column if exists email_hash;

create index if not exists reviews_status_idx on public.reviews (status);
create index if not exists reviews_status_order_idx on public.reviews (status, display_order);

-- updated_at auto-touch (the function already exists if schema.sql was run;
-- created here too so this file stands alone).
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ── 3. Row Level Security ───────────────────────────────────

alter table public.reviews enable row level security;

-- Anonymous visitors see approved reviews only; a pending or rejected row is
-- invisible even if its id is known.
drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews" on public.reviews
  for select using (status = 'approved');

-- Submitting requires a signed-in account, and the row must carry that
-- account's own id — auth.uid() comes from the verified JWT, so nobody can
-- post as someone else. Owner-only fields must be empty.
drop policy if exists "Public submit reviews" on public.reviews;
drop policy if exists "Signed-in submit reviews" on public.reviews;
create policy "Signed-in submit reviews" on public.reviews
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and status = 'pending'
    and picture is null
    and link is null
    and featured = false
    and char_length(name) between 1 and 80
    and char_length(text) between 20 and 1000
  );

drop policy if exists "Owner manage reviews" on public.reviews;
create policy "Owner manage reviews" on public.reviews
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ── 4. Close the hole public sign-in opens on the other tables ──
-- These policies used to say `using (true)` for any authenticated user,
-- which was fine while the only account was the owner's. It is not fine now
-- that any Google account can sign in.

drop policy if exists "Owner manage projects" on public.projects;
create policy "Owner manage projects" on public.projects
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Owner manage technologies" on public.technologies;
create policy "Owner manage technologies" on public.technologies
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Owner manage project_technologies" on public.project_technologies;
create policy "Owner manage project_technologies" on public.project_technologies
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Owner manage portfolio_settings" on public.portfolio_settings;
create policy "Owner manage portfolio_settings" on public.portfolio_settings
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Done. Reload the site and the review form will work.
