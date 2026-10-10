# mf-drops — plan

For: Midnight Fusion. A public board where Justin and anyone he sends the link to can put up pictures and videos, download them, and where Justin alone can take things down.

## 0. What exists today
The house scaffold plus the drops board: a public grid of pictures and videos newest first, each with who, when, size and a Download; an upload box anyone can use (name required, caption optional, pictures and videos only, 500 MB cap); owner sign-in with a Take down button per card. Files live in a public Supabase Storage bucket, rows in `mf_drops`. Every write goes through a checked function. Demo mode mirrors the rules so Playwright runs with no database.

## 1. Gap analysis
| Ask | Status |
|---|---|
| Upload videos and pictures | 1.1 |
| Take them down | 1.1, owner only |
| People can download | 1.1, public bucket, Download on every card |
| People can upload their own | 1.1, name required, no login |
| Big 4K videos | Open: 500 MB cap per file in 1.1; resumable uploads and a higher cap are 1.2 |

## 2. Schema
`mf_drops` (id, kind, title, by, path, bytes, mime, created_at), RLS read-all. Functions `mf_add_drop` (anon + authenticated) and `mf_take_down` (authenticated, returns the path so the client removes the file). Bucket `drops`: public read, anyone inserts, authenticated deletes, 500 MB, image and video MIME types only.

## 3. Permission matrix
| Who | Read | Add | Take down |
|---|---|---|---|
| Anyone with the link | yes | yes, with a name | no |
| Owner (signed in; sign-ups are off) | yes | yes | yes |

## 4. Increments
| # | What | Size |
|---|---|---|
| 1.0 | **Shipped.** Repo, scaffold, CI, docs. | S |
| 1.1 | **Built, awaiting deploy.** The drops board: public grid, anyone uploads, owner takes down, Download on every card. 3 unit tests, 3 e2e on desktop and phone. | M |
| 1.2 | Resumable uploads for files over 500 MB, server-side thumbnails for videos, a "remove my own" link for uploaders. | M |
| 1.3 | Abuse controls if the link spreads: per-day upload cap per IP, a report button, a hidden-until-approved switch. | M |

## 5. Questions and blockers
1. Per-file cap: **500 MB** until 1.2. A 4K clip of 6 seconds is well under; a 2-minute 4K file is not.
2. Who may upload: **anyone with the link**, name required. Flip to owner-only by dropping the `anon` grant on `mf_add_drop` and the anon insert policy on the bucket.
3. Supabase plan: Storage on the free tier is 1 GB; Pro is 100 GB. Videos will push past 1 GB fast.
