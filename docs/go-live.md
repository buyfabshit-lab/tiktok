# mf-drops — go-live checklist

Who does what is in bold.

## 1. Supabase Auth switches (**Justin**, dashboard, five minutes)
Supabase → mf-drops → Authentication:
1. **Providers → Email**: minimum password length **12**, required characters **letters and digits**.
2. **Leaked password protection: on** (Pro plan).
3. **Allow new users to sign up: off.** Logins are created by an admin.

Check: try to sign up with a new email on the login page; it must be refused.

## 2. Railway variables (**Justin**, once)
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from Supabase → Settings → API. Redeploy. The app shows "Almost there" until both are set.

## 3. First admin (**Justin**)
Authentication → Users → Add user (the client's email, a 12-character password). Share it once, out of band.

## Still needed from the client
- _inputs the plan's open questions wait on_
