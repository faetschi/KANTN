# KANTN Angular App

Angular frontend with Supabase backend, deployed on Vercel.

## Quick Start (Dev)

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

3. Generate runtime env file:

```bash
node scripts/generate-env.js
```

4. Start dev server:

```bash
npm run dev
```
App URL: `http://localhost:4000`

## Test Locally (Production)

Build and run the production SSR server output:

```bash
npm run build:prod
npm run serve:ssr:app
```
Open: `http://localhost:4000`

### Approve User & Admin Access
- After a user logs in once (so a profile exists), approve their account:

    ```sql
    select * from set_user_role_by_email('faetschi.ai@gmail.com', true, false);
    ```

- Promote a user to admin via SQL:

    ```sql
    select * from set_user_role_by_email('faetschi.ai@gmail.com', true, true);
    ```

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

Then push to main branch or use the manual production deploy command:

```bash
vercel --prod
```

## Useful Commands

- `npm run lint` — lint checks
- `npm test` — unit tests

## More Docs

- `BUGS.md` — known issues
