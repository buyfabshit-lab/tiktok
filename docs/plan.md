# mf-drops — plan

For: Midnight Fusion drops: upload videos and pictures, take them down, let people download or upload their own

## 0. What exists today
The scaffold: sign-in, one `notes` table behind RLS, one security-definer write, CI with typecheck, unit tests, build and a Playwright smoke on desktop and phone. Deployed from `main`.

## 1. Gap analysis
_What the client asked for, section by section, against what exists. Each gap names the increment that closes it._

## 2. Schema changes
_Tables, functions, policies. Prefix everything `mf-drops_`._

## 3. Permission matrix
_Who can read and write what. Defaults apply until the client answers._

## 4. Increments

| # | What | Size |
|---|---|---|
| 1.0 | **Shipped.** Repo, scaffold, CI, first migration, Railway deploy. | S |
| 1.1 | _first real increment from the client's ask_ | |

One reviewed PR per increment. The app stays deployable after every merge.

## 5. Questions and blockers
_Each with the default that applies if nobody answers._
