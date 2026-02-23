DEVELOPMENT
===========

This document lists the standard commands and safety notes for running the app locally during development.

Prerequisites
- Node.js (recommended 18+ or the version you use in development)
- npm (or yarn)

Local environment keys (development only)
- Create a development-only loader file at `public/env.local.js` (do NOT commit):

```js
// public/env.local.js (DEVELOPMENT ONLY - DO NOT COMMIT)
window.SUPABASE_URL = 'https://abcde12345.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJI...REDACTED';
```

The app will automatically load `env.local.js` when running on `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, or when using dev ports `4200`, `3000`, or `5000`.

Start development server (recommended)
- Fast dev server (uses port 3000 by default in this project):

```bash
npm install
npm run dev
# open http://localhost:3000
```

- Default Angular start (port 4200):

```bash
npm run start
# open http://localhost:4200
```

Hot Module Replacement
- Run HMR for faster feedback (if configured):

```bash
npm run start:hmr
```

If port 4200 or 3000 is already in use
- Start on a different port by passing `--port` to the underlying `ng` command:

```bash
npm run start -- --port=4300
```
or
```bash
npm run dev -- --port=4300
```

Testing the OAuth redirect locally
1. Make sure `public/env.local.js` exists and contains your Supabase keys.
2. Ensure `http://localhost:3000/oauth/consent` (or `:4200`/`:5000`) is added to Supabase Redirect URLs.
3. Start the dev server (see above) and open `/login`.
4. Click the login button — after provider consent you should be redirected to `/oauth/consent`, the app will finish sign-in and navigate to `/home`.

Serve production build locally (test service worker)

```bash
npm run build:prod
npx serve dist/app/browser -l 5000
# open http://localhost:5000
```

Clearing service worker cache during development
- In Chrome DevTools → Application → Service Workers: unregister the worker and clear site data to test fresh builds.

Other helpful commands
- Run tests: `npm test`
- Lint: `npm run lint`

Security notes
- Never commit `public/env.local.js` or `.env.local` — they are ignored by `.gitignore`.
- Use Vercel environment variables for production secrets.

If you'd like, I can add a small npm script to convert a `.env.local` into `public/env.local.js` automatically (keeps secrets out of source control). Ask me to add that and I'll push it to your branch.
