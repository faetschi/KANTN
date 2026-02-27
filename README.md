# KANTN Angular App

Angular frontend with Supabase backend, deployed on Vercel.

## Quick Start (Local)

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in project root:

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
ENABLE_DEV_AUTH=false
APP_URL=http://localhost:4000
```

3. Start dev server:

```bash
npm run dev
```

App URL: `http://localhost:4000`

## Test Locally (Production-like)

Build and serve the production browser output:

```bash
npm run build:prod
npx serve dist/app/browser -l 4000
```

Open: `http://localhost:4000`

## Deploy to Vercel

Use these Vercel settings:

- Build Command: `npm run build:prod`
- Output Directory: `dist/app/browser`
- Environment Variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

Then in Supabase Auth URL settings, add redirect URLs:

- `https://<your-vercel-app>.vercel.app/oauth/consent`
- `http://localhost:4000/oauth/consent`

## Useful Commands

- `npm run dev` — local development server
- `npm run build:prod` — production build
- `npm run lint` — lint checks
- `npm test` — unit tests

## More Docs

- `DEVELOPMENT.md` — detailed local workflow
- `PRODUCTION.md` — production deployment/checklist
- `BUGS.md` — known issues
