PRODUCTION (minimal)
====================

1) Set production env vars on Vercel (Project → Settings → Environment Variables):

- `SUPABASE_URL` (e.g. `https://<project>.supabase.co`)
- `SUPABASE_ANON_KEY` (client anon key)

2) Add Supabase redirect URL

- After your first production deploy add:
  - `https://fit-track-faetschi.vercel.app/oauth/consent`

3) Deploy

- Merge `main` (connected to Vercel) or run:

```bash
# manual: from local machine
vercel --prod
```

4) Verify

- Open production URL and test the login flow (use Incognito to avoid cached sessions).
- If OAuth fails: check browser console and Network for callback requests and CORS/401 errors.

Notes
- Use Vercel environment variables for production secrets; never commit keys.
- Vercel dashboard shows build logs and allows rollbacks.

