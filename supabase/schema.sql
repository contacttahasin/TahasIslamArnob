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
-- Row Level Security
--
-- This is a single-owner CMS with no signup path anywhere in the app, so
-- Supabase Auth will only ever contain the one manually-created owner user.
-- That makes "authenticated" == "the owner" in practice; the app layer
-- (middleware + every server action) additionally re-checks the session's
-- email against OWNER_EMAIL before any mutation runs, as defense in depth.
--
-- Reads are public (`using (true)`, no auth required) because this data
-- drives the public portfolio site's pages, which anonymous visitors browse
-- freely. Writes require an authenticated session.
-- ============================================================

alter table public.projects enable row level security;
alter table public.technologies enable row level security;
alter table public.project_technologies enable row level security;
alter table public.portfolio_settings enable row level security;

drop policy if exists "Public read projects" on public.projects;
create policy "Public read projects" on public.projects for select using (true);
drop policy if exists "Owner manage projects" on public.projects;
create policy "Owner manage projects" on public.projects for all to authenticated using (true) with check (true);

drop policy if exists "Public read technologies" on public.technologies;
create policy "Public read technologies" on public.technologies for select using (true);
drop policy if exists "Owner manage technologies" on public.technologies;
create policy "Owner manage technologies" on public.technologies for all to authenticated using (true) with check (true);

drop policy if exists "Public read project_technologies" on public.project_technologies;
create policy "Public read project_technologies" on public.project_technologies for select using (true);
drop policy if exists "Owner manage project_technologies" on public.project_technologies;
create policy "Owner manage project_technologies" on public.project_technologies for all to authenticated using (true) with check (true);

drop policy if exists "Public read portfolio_settings" on public.portfolio_settings;
create policy "Public read portfolio_settings" on public.portfolio_settings for select using (true);
drop policy if exists "Owner manage portfolio_settings" on public.portfolio_settings;
create policy "Owner manage portfolio_settings" on public.portfolio_settings for all to authenticated using (true) with check (true);

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
