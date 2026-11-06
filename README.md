# Jade Book Nest

Reading Challenge 2026. Pairs log what they are reading, finished-book reviews, a kick-off, and a best book. The dashboard shows the public feed, JBN Dynamic Duo standings, and Junior Bookworm.

Login is **name and password**. There is no email login.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

When `DATABASE_URL` is not set, the app stores data in a SQLite file at `data/booknest.sqlite` and the footer says so. Delete that file to reseed the sample challenge.

## Point it at Supabase Postgres

The app reads a Postgres connection string. It does **not** read `SUPABASE_URL`, `SUPABASE_ANON_KEY`, or a service role key.

1. In Supabase, open **Project Settings → Database** and copy the URI.
2. Put it in `.env.local`:

```bash
DATABASE_URL=postgresql://...
```

3. Optional organizer, instead of the sample account:

```bash
ADMIN_NAME=your-name
ADMIN_PASSWORD=your-password
```

`ADMIN_PASSWORD` is a secret. Do not commit it. `.env.example` lists the names only.

On startup the app applies `supabase/migrations/0001_init.sql` if the tables are missing. You can also run that file in the Supabase SQL editor. An empty database is seeded once with the sample pairs so the boards match the challenge. Delete the rows (or use a fresh database) before pointing a real event at it.

Sessions are an httpOnly cookie backed by a row in `sessions`. Passwords are bcrypt hashes.

## Sample logins

Shown on the home banner when `ADMIN_NAME` and `ADMIN_PASSWORD` are not both set:

| Name | Password | Role |
| --- | --- | --- |
| organizer | `1z835v003e1f` | Organizer. Can add points adjustments. |

Sample readers (not shown on the home banner). Every one of them uses the same dev password:

| Name | Password | Pair | Age |
| --- | --- | --- | --- |
| Ava | `readtogether` | Ava & Leo | 36 |
| Leo | `readtogether` | Ava & Leo | 14 |
| Mira | `readtogether` | Mira & Ned | 33 |
| Ned | `readtogether` | Mira & Ned | 12 |
| Nia | `readtogether` | Nia & Otto | 35 |
| Otto | `readtogether` | Nia & Otto | 12 |

## Scoring

Windows are UTC calendar dates. Season: **1 Nov 2026 – 31 Dec 2026**.

- **Currently reading:** 0 points. Shows on the public feed.
- **Kick-off, 1–8 Nov 2026:** intro plus the books you are starting. 2 points, once per pair.
- **Finished book, 1 Nov–31 Dec 2026:** 1 point, or 2 when the copy was borrowed from Jade Book Nest. The same title on a pair counts once (case-insensitive, trailing punctuation ignored). A later entry scores 0 and is marked “Not counted”.
- **Best book, 25–31 Dec 2026:** one recommendation per pair, 2 points.
- Outside its window, the entry is kept and scores 0 until an organizer adds an adjustment.
- JBN Dynamic Duo ranks pairs by entry points plus organizer adjustments.
- Junior Bookworm ranks people aged 10–18 in a pair by the points on entries they wrote.
- Books of every genre and format count. The app does not cap entries at one book per week.
