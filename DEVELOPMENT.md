DEVELOPMENT (minimal)
=====================

Quick start (local dev)

1. Add a non‑committed `public/env.local.js` with your Supabase keys:

```js
// public/env.local.js (DEVELOPMENT ONLY — DO NOT COMMIT)
window.SUPABASE_URL = 'https://<your-project>.supabase.co';
window.SUPABASE_ANON_KEY = '<anon-key>';
```

2. Start dev server:

```bash
npm install
npm run dev      # or `npm run start` for default ng serve
```

3. Test OAuth flow:
- Ensure `http://localhost:3000/oauth/consent` (or the port you run) is in Supabase Redirect URLs.
- Open `/login` → follow provider → app should finish at `/oauth/consent` then redirect to `/home`.

Serve production bundle locally (optional):

```bash
npm run build:prod
npx serve dist/app/browser -l 5000
```

Notes
- `public/env.local.js` is loaded only on localhost/dev ports and is ignored by `.gitignore`.
- Use Vercel env vars for production; never commit prod keys.
