# mf-drops — go-live checklist

Who does what is in bold.

## 1. Repo (**Justin**, three taps)
github.com/new → name `mf-drops` → Private → Create repository. Then add it to the Claude GitHub App at github.com/settings/installations → Claude → Configure → Select repositories. Claude pushes the code.

## 2. Supabase project (**Justin creates or reconnects**, Claude applies)
Either reconnect the Supabase connector in claude.ai so Claude can create the project and apply `supabase/migrations/0001_init.sql`, or on a PC: `supabase projects create mf-drops --region us-west-1`, then `supabase link` and `supabase db push`. Pro plan if videos will pass 1 GB.

## 3. No login (**nothing to do**)
There is no sign-in anywhere. Leave Authentication alone; the app never calls it.

## 4. Railway (**Justin**, two clicks)
New Project → Deploy from GitHub repo → `buyfabshit-lab/mf-drops`. Variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from Supabase → Settings → API. The page says "Almost there" until both are set.

## 5. Smoke (**Justin**, two minutes)
Open the Railway URL. Drop a picture with your name. See it in the grid. Tap Download. Share the link with one person and have them drop a video.
