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

## Reviews (added later)

The testimonials on the home page ("The Voice Behind") are now database-backed
and have their own admin section at `/admin/reviews`.

**Run [`supabase/reviews-migration.sql`](supabase/reviews-migration.sql) once**
(Dashboard → SQL Editor → New query → paste the whole file → Run). It creates
the `reviews` table, the owner check, and the policies, and it already
contains the `app_owner` row for `OWNER_EMAIL`. Idempotent — re-running it
changes nothing.

The same statements also live in `supabase/schema.sql`; the split-out file
just makes them quick to paste. Until it has been run, the review form
answers "Reviews are not set up on this site yet."

Two write paths, deliberately different:

- **Visitors** sign in with Google from the home page ("Leave a review") and
  fill in two things: a star rating and their text. Their name and picture are
  read from the Google account server-side, never from the form, so a review
  cannot be posted under someone else's name. The row is written as `pending`,
  which the public site cannot read, so nothing appears until you approve it.
- **You** can add, edit, approve, reject or delete anything from
  `/admin/reviews`, and only you can set a review's **avatar image** (upload or
  pasted link) and **source link**. Those two are owner-only on purpose:
  `next.config.ts` lets the image optimizer load from any https host, which is
  safe only while every such URL was typed by you.

### Turning on Google sign-in

Visitors sign in with Google to leave a review — that is the only way to get
a real name and a real profile picture, because no API turns an email address
into someone's Google photo.

You set this up in your own accounts; nothing here needs the credentials, and
they never enter this codebase:

1. **Google Cloud Console** → APIs & Services → Credentials → *Create
   credentials* → **OAuth client ID** → Web application.
   - Authorised redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client secret**.
2. **Supabase Dashboard** → Authentication → **Providers** → **Google** →
   enable, paste the two values, Save.
3. **Supabase Dashboard** → Authentication → **URL Configuration** → add your
   site's URL (and `http://localhost:3000` for local work) to *Redirect URLs*.

### Say which account is yours

Signing in with Google now creates real Supabase sessions for strangers, so
"authenticated" no longer means "the owner". The policies name you explicitly
instead. Run this once, with your own login email:

```sql
insert into public.app_owner (email) values ('you@example.com');
```

It must match `OWNER_EMAIL` in `.env.local`. Until that row exists, the admin
panel can read but not write.

### Profile pictures

Reviews show, in order:

1. an avatar **you** set in the admin panel, if there is one;
2. otherwise the **picture from the reviewer's Google account**, copied
   server-side when they submit;
3. otherwise their **initials**.

The email address behind the Google account is never stored. Reads on the
reviews table are public, so anything kept in it is effectively published —
only the account id, display name and picture URL go in.

Until the table has an approved review in it, the section falls back to the
placeholder set in `data/reviews.ts`, each with a generated avatar.
