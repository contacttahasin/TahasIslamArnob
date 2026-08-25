-- Owner-only Portfolio CMS — full schema.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New
-- query → paste → Run). Safe to re-run: every statement is idempotent.
--
-- This does NOT create the owner's login — Supabase Auth users are created
-- separately (Dashboard → Authentication → Users → Add user), never via SQL
-- or app code, so the owner's password is never handled by this codebase.
-- See ../ADMIN_SETUP.md for the full setup walkthrough.

create extension if not exists pgcrypto;

-- ============================================================
-- Types
-- ============================================================

do $$ begin
  create type project_type as enum ('latest', 'portfolio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('published', 'draft');
exception when duplicate_object then null; end $$;

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  type project_type not null,
  title text not null,
  slug text not null unique,
  description text not null default '',
  full_description text not null default '',
  live_url text,
  github_url text,
  cover_image text,
  gallery_images text[] not null default '{}',
  featured boolean not null default false,
  status project_status not null default 'draft',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_type_idx on public.projects (type);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_type_order_idx on public.projects (type, display_order);

create table if not exists public.technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

-- Many-to-many: a project can use many technologies, a technology can be
-- used by many projects. Deleting a project or a technology cleans up the
-- links automatically (on delete cascade) rather than leaving orphans.
create table if not exists public.project_technologies (
  project_id uuid not null references public.projects (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  primary key (project_id, technology_id)
);

-- Single-row settings table. The boolean primary key defaulting to `true`
-- plus the check constraint is a standard Postgres idiom for enforcing
-- "exactly one row can ever exist" — a second insert would need id=false,
-- but the check constraint requires id=true, so it's rejected.
create table if not exists public.portfolio_settings (
  id boolean primary key default true,
  constraint portfolio_settings_singleton check (id),
  name text,
  job_title text,
  about text,
  location text,
  availability text,
  email text,
  phone text,
  whatsapp text,
  github text,
  linkedin text,
  facebook text,
  instagram text,
  twitter text,
  resume_url text,
  meta_title text,
  meta_description text,
  og_image text,
  logo text,
  favicon text,
  accent_color text,
  loader text,
  updated_at timestamptz not null default now()
);

insert into public.portfolio_settings (id) values (true) on conflict (id) do nothing;

-- ============================================================
-- updated_at auto-touch
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists portfolio_settings_set_updated_at on public.portfolio_settings;
create trigger portfolio_settings_set_updated_at
  before update on public.portfolio_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- Who the owner is
--
-- Visitors can now sign in with Google to leave a review, so "authenticated"
-- no longer means "the owner" — it means anyone with a Google account. Every
-- owner-only policy therefore has to name the owner explicitly instead of
-- trusting the authenticated role.
--
-- Put YOUR OWN login email in this table, once:
--   insert into public.app_owner (email) values ('you@example.com');
-- It must match OWNER_EMAIL in .env.local.
-- ============================================================

create table if not exists public.app_owner (
  email text primary key
);

-- RLS on with no policies at all: nothing can read this table through the
-- API. Only is_owner() below can see it, because a security-definer
-- function runs with the definer's rights and bypasses RLS.
alter table public.app_owner enable row level security;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_owner
    where email = (auth.jwt() ->> 'email')
  );
$$;

-- ============================================================
-- Row Level Security
--
-- This used to be a single-owner CMS with no signup path, which made
-- "authenticated" mean "the owner". That is no longer true: visitors sign in
-- with Google to leave a review, so any Google account is an authenticated
-- one. Every owner-only policy therefore goes through is_owner() above,
-- which matches the session's email against public.app_owner — being logged
-- in is not, on its own, permission to write anything here.
--
-- The app layer re-checks the same thing independently (proxy.ts, plus
-- requireOwner() in every admin Server Action), as defense in depth.
--
-- Reads are public (`using (true)`, no auth required) because this data
-- drives the public portfolio site's pages, which anonymous visitors browse
-- freely. Writes require the owner.
-- ============================================================

alter table public.projects enable row level security;
alter table public.technologies enable row level security;
alter table public.project_technologies enable row level security;
alter table public.portfolio_settings enable row level security;

drop policy if exists "Public read projects" on public.projects;
create policy "Public read projects" on public.projects for select using (true);
drop policy if exists "Owner manage projects" on public.projects;
create policy "Owner manage projects" on public.projects
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Public read technologies" on public.technologies;
create policy "Public read technologies" on public.technologies for select using (true);
drop policy if exists "Owner manage technologies" on public.technologies;
create policy "Owner manage technologies" on public.technologies
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Public read project_technologies" on public.project_technologies;
create policy "Public read project_technologies" on public.project_technologies for select using (true);
drop policy if exists "Owner manage project_technologies" on public.project_technologies;
create policy "Owner manage project_technologies" on public.project_technologies
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Public read portfolio_settings" on public.portfolio_settings;
create policy "Public read portfolio_settings" on public.portfolio_settings for select using (true);
drop policy if exists "Owner manage portfolio_settings" on public.portfolio_settings;
create policy "Owner manage portfolio_settings" on public.portfolio_settings
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ============================================================
-- Storage — one public bucket, folder-prefixed (covers/, gallery/,
-- resume/, branding/) rather than one bucket per media kind, matching the
-- CMS's single "Media Library" section.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read portfolio-media" on storage.objects;
create policy "Public read portfolio-media" on storage.objects
  for select using (bucket_id = 'portfolio-media');

drop policy if exists "Owner upload portfolio-media" on storage.objects;
create policy "Owner upload portfolio-media" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio-media');

drop policy if exists "Owner update portfolio-media" on storage.objects;
create policy "Owner update portfolio-media" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio-media');

drop policy if exists "Owner delete portfolio-media" on storage.objects;
create policy "Owner delete portfolio-media" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio-media');

-- ============================================================
-- Reviews / testimonials
--
-- Two write paths, deliberately asymmetric:
--   * visitors may INSERT only, and only as 'pending' — nothing a stranger
--     submits is ever rendered on the site until the owner approves it;
--   * the owner may do anything, including setting the avatar image and
--     source link (those two are owner-only fields precisely because the
--     Next image optimizer is configured to accept any https host, so a
--     public submitter must never be able to write a URL into them).
-- ============================================================

do $$ begin
  create type review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null default '',
  company text not null default '',
  text text not null,
  -- Avatar: an uploaded media URL or a pasted external link, owner-set.
  -- Null falls back to the Gravatar built from email_hash below.
  picture text,
  -- Set when a visitor submitted the review while signed in with Google.
  -- The name and picture are copied from that Google account server-side,
  -- never sent up by the browser. The address itself is deliberately not
  -- stored: reads on this table are public, so anything kept in it is
  -- effectively published.
  author_id uuid references auth.users (id) on delete set null,
  author_avatar text,
  -- Source of the review (LinkedIn recommendation, company site, …).
  link text,
  rating smallint check (rating is null or (rating between 1 and 5)),
  status review_status not null default 'pending',
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to run against a database created by an earlier version of this file.
alter table public.reviews add column if not exists author_id uuid references auth.users (id) on delete set null;
alter table public.reviews add column if not exists author_avatar text;
-- Superseded by Google sign-in; it only ever held hashes, never addresses.
alter table public.reviews drop column if exists email_hash;

create index if not exists reviews_status_idx on public.reviews (status);
create index if not exists reviews_status_order_idx on public.reviews (status, display_order);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

-- Anonymous visitors read approved reviews only. A pending or rejected row
-- is invisible to the public site even if its id is known.
drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews" on public.reviews
  for select using (status = 'approved');

-- Submitting requires a signed-in Google account, and the row must be
-- stamped with that account's own id: `auth.uid()` is read from the verified
-- JWT, so a crafted request cannot post as somebody else. Still pending,
-- still no owner-only fields — `with check` is evaluated against the row as
-- inserted, so none of this can be smuggled past.
drop policy if exists "Public submit reviews" on public.reviews;
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
