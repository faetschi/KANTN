
## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. (Optional) Set any required API keys in [.env.local](.env.local)
3. Run the app:
   `npm run dev`

## Deploying as a Progressive Web App (Vercel)

- Ensure PWA support is enabled (service worker, manifest, icons). The repository now includes PWA files (`public/manifest.webmanifest` and `ngsw-config.json`).
- Vercel build settings:
   - Build Command: `npm run build:prod`
   - Output Directory: `dist/app/browser`
   - `vercel.json` is included and configured to serve the SPA.
- Environment variables to set in the Vercel dashboard:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_ANON_KEY` — the anon/public key used by the client

Deployment steps:

```bash
# Build production assets
npm run build:prod

# Commit and push to GitHub
git add -A && git commit -m "build: prepare for vercel" && git push

# In Vercel: connect this repo -> set build command and output directory above -> add env vars -> Deploy
```

Supabase redirect URLs (for OAuth/social login):
- Add your Vercel app URL (https://your-app.vercel.app) as a redirect URL in Supabase Auth settings.
- Add `http://localhost:4200` for local testing.

Notes:
- After deploying, run a Lighthouse PWA audit and validate `Add to Home Screen` behavior on iOS/Android.
- If you prefer CI-driven builds, Vercel will build on push automatically when connected to the repository.

## Production-ready checklist

- Build and verify production bundle (includes service worker):

```bash
# Build production assets
npm run build:prod

# Serve the production output locally to test service worker (example using `serve`):
npm install -g serve
serve dist/app/browser -l 5000

# Open http://localhost:5000 and check offline behavior / Lighthouse audit
```

- Verify `dist/app/browser` contains `index.html`, `ngsw-worker.js`, and `ngsw.json` (Angular Service Worker).
- Vercel settings: build command `npm run build:prod`, output `dist/app/browser` (already configured in `vercel.json`).
- Required environment variables in Vercel:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_ANON_KEY` — Supabase anon/public key

- Supabase OAuth redirect URLs:
   - `https://<your-vercel-app>.vercel.app` (production)
   - `http://localhost:5000` (local static serve)
 
## Vercel environment variables — exact values and examples

Add these environment variables in Vercel Project Settings (set for both Preview and Production if you want PR previews to work):

- `SUPABASE_URL` — your Supabase project URL
   - Example: `https://abcde12345.supabase.co`
- `SUPABASE_ANON_KEY` — Supabase anon/public key used by the client
   - Example (redacted): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...REDACTED`

Local development:
- Create a `.env.local` (ignored by git) at project root with the same keys for local testing:

```env
SUPABASE_URL=https://abcde12345.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJI...REDACTED
```

GitHub → Vercel quick setup (PR-ready workflow):

1. Push the branch created by the script (see commit below) to GitHub.
2. In Vercel, click **New Project** → import this GitHub repo.
    - Vercel will detect Angular; confirm Build Command is `npm run build:prod` and Output Directory is `dist/app/browser` (this repo already includes `vercel.json`).
3. Add environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) under Project Settings → Environment Variables.
4. Enable Automatic Deploys; Vercel will create Preview Deployments for PRs and Production on merges to `main`.
5. After the first production deploy, add the Vercel URL as a redirect in Supabase Auth settings.

Creating the PR:
- A branch has been pushed with these README updates (branch: `feat/vercel-setup`). Open a Pull Request on GitHub against `main`, review, then merge to trigger a production deploy.

If you'd like, I can also add a `.github/PULL_REQUEST_TEMPLATE.md` to this branch or run a Lighthouse audit on the deployed URL.