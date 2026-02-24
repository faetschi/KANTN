DEVELOPMENT (minimal)
=====================

Run locally

1) Create `.env` in project root (or set env vars):

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
# optional: enables fake auth on localhost if true
ENABLE_DEV_AUTH=false
```

2) Install deps once:

```bash
npm install
```

3) Create env variables from .env file

```bash
node scripts/generate-env.js
```

4) Start dev server (SSR + LAN-ready):

```bash
npm run dev
# or disable HMR
npm run dev:nohmr
```

5) OAuth redirect for Supabase:
- Add `http://localhost:3000/oauth/consent` to Supabase Redirect URLs (match port if changed).

Optional: production build preview

```bash
npm run build:prod
npm run serve:ssr:app
# or
npx serve dist/app/browser -l 5000
```

Notes
- `npm run dev` auto-generates `public/env.js` from `.env`.
- `.env` stays local; use Vercel env vars in production.
