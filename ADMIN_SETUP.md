# Admin CMS Setup

Owner-only CMS at `/admin`. One-time setup, then it's ready.

## 1. Create a Supabase project

[supabase.com/dashboard](https://supabase.com/dashboard) → New project. Free tier is enough.

## 2. Run the schema

Dashboard → **SQL Editor** → New query → paste the contents of
[`supabase/schema.sql`](supabase/schema.sql) → Run. Safe to re-run if you ever need to.

This creates the `projects`, `technologies`, `project_technologies`, and
`portfolio_settings` tables, Row Level Security policies, and the
`portfolio-media` storage bucket.

## 3. Create your login (the owner account)

Dashboard → **Authentication → Users → Add user → Create new user**.

- Email: the same address as `OWNER_EMAIL` below.
- Password: whatever you want to log in with. **Set it here, not anywhere in
  this codebase** — the app never stores or sees this password; it only asks
  Supabase to verify it at login time.
- Check "Auto Confirm User" so you don't need to click an email link first.

Only ever create the one user. There is no signup page anywhere in this app.

## 4. Fill in `.env.local`

From Dashboard → **Project Settings → API**:

```
OWNER_EMAIL=              # the email you used in step 3
NEXT_PUBLIC_SUPABASE_URL=       # "Project URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # "anon public" key
SUPABASE_SERVICE_ROLE_KEY=      # "service_role" key — keep this one secret
```

These four lines already exist as empty placeholders in `.env.local` — fill
them in there.

## 5. (Optional) Password reset emails

The "Forgot password?" link on `/admin/login` uses Supabase's built-in email
sending. It works out of the box in development (Supabase's default email
service), but for production you'll want Dashboard → **Authentication →
Email Templates** to customize the reset email, and **Authentication → URL
Configuration** to add your production domain to the allowed redirect URLs
(`https://yourdomain.com/admin/reset-password`).

## 6. Run it

```bash
npm run dev
```

Visit `/admin` → redirects to `/admin/login` → sign in with the account from
step 3.

## How it's protected

- `middleware.ts` blocks every `/admin/*` request unless the session's email
  exactly matches `OWNER_EMAIL`.
- Every Server Action re-checks the same thing server-side
  (`app/admin/lib/auth.ts`'s `requireOwner()`) — middleware is the first
  gate, not the only one.
- Row Level Security on every table requires an authenticated Supabase
  session for any write; reads are public (the public portfolio site's
  pages need to read this data too).

## What this does *not* do

The public site (`app/(site)/`) still reads its content from the static
files in `data/*.ts`, same as before — this CMS writes to Supabase, but
nothing on the public pages has been wired up to read from Supabase instead.
Connecting the two is a separate, bigger change; ask if you want that done.
