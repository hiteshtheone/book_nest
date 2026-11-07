# Jade Book Nest

Reading Challenge 2026. Pairs log what they are reading, finished-book reviews, a kick-off, and a best book. The dashboard shows the public feed, JBN Dynamic Duo standings, and Junior Bookworm.

Login is **name and password**. There is no email login.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local development uses the same Supabase Postgres database as production. Copy the URI from the Supabase project **book_nest** (**Project Settings → Database**) into `.env.local`:

```bash
DATABASE_URL=postgresql://...
```

The database starts empty. Choose **Sign up**, enter a name, password, and age, and create a pair by entering your partner’s name. Your partner joins by signing up or signing in with that name. One pair per person.

## Supabase Postgres

The app reads a Postgres connection string. It does **not** read `SUPABASE_URL`, `SUPABASE_ANON_KEY`, or a service role key. `DATABASE_URL` is required locally and on Vercel. Without it, pages show a configuration message instead of creating a file database.

Optional organizer, who can add points adjustments:

```bash
ADMIN_NAME=your-name
ADMIN_PASSWORD=your-password
```

`ADMIN_PASSWORD` is a secret. Do not commit it. `.env.example` lists the names only. Without those two, nobody is an organizer until you set them. Readers still sign up from the app.

On startup the app applies `supabase/migrations/0001_init.sql` if the tables are missing. You can also run that file in the Supabase SQL editor. It does not insert sample readers.

Sessions are an httpOnly cookie backed by a row in `sessions`. Passwords are bcrypt hashes.

## Deploy on Vercel

Set this environment variable on the Vercel project. Do not commit the value.

- `DATABASE_URL` — the Supabase Postgres connection string (Project Settings → Database → URI).

That is the only database variable this app reads. It does not read `SUPABASE_URL`, an anon key, or a service role key. On Vercel the filesystem is read-only, so the app does not create `data/` or a SQLite file. If `DATABASE_URL` is missing, sign-in shows a configuration message instead of crashing.

## Scoring

Windows are UTC calendar dates. Season: **1 Nov 2026 – 31 Dec 2026**.

- **First entry:** the first entry a pair saves is worth 2 points, once per pair. Later entries follow the rules below.
- **Currently reading:** 0 points. Shows on the public feed.
- **Kick-off, 1–8 Nov 2026:** intro plus the books you are starting. 2 points, once per pair.
- **Finished book, 1 Nov–31 Dec 2026:** 1 point, or 2 when the copy is from the Jade Book Nest library. The same title on a pair counts once (case-insensitive, trailing punctuation ignored). A later entry scores 0 and is marked “Not counted”.
- **Best book, 25–31 Dec 2026:** one recommendation per pair, 2 points.
- Outside its window, a later entry is kept and scores 0 until an organizer adds an adjustment.
- JBN Dynamic Duo ranks pairs by entry points plus organizer adjustments.
- Junior Bookworm ranks people aged 10–18 in a pair by the points on entries they wrote.
- Books of every genre and format count. The app does not cap entries at one book per week.
