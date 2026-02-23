PRODUCTION DEPLOYMENT
=====================

This document explains how to verify the OAuth login flow locally and deploy the app to Vercel for production.

1) Test locally (OAuth flow)
- Install and run the app using your normal local dev commands (example):
  - `npm install`
  - `npm run dev` or `npm start`
- In the running app click the login button and follow the OAuth flow.
- After a successful sign-in you should be redirected to `/oauth/consent`. The component at that path must finish the login and forward you to `/home`. Verify you end up at `/home` and are authenticated.

2) Prepare for production
- Make sure any required environment variables from your local setup are available in Vercel. Typical variables for Supabase-based apps include:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - any other custom keys your app uses (copy from local `.env` or Supabase settings)

3) Push, create PR, merge
- From your feature branch (for example `feat/oauth-consent`):
  - `git add PRODUCTION.md`
  - `git commit -m "chore: add production deployment notes"`
  - `git push --set-upstream origin feat/oauth-consent`
- Create a Pull Request on GitHub and merge into `main` when approved. (You can also use the `gh` CLI: `gh pr create --fill` then `gh pr merge`.)

4) Deploy to Vercel
- If your repository is connected to Vercel, merging `main` will automatically trigger a production deploy.
- Alternatively, from your machine you can run the Vercel CLI to create a production deployment:
  - Install CLI: `npm i -g vercel`
  - Run: `vercel --prod`
- In the Vercel project settings, add the same environment variables you used locally.

5) Supabase redirect URL (critical)
- After the production deploy finishes, add the exact consent redirect path to Supabase Auth settings:
  - Redirect URL to add: `https://fit-track-faetschi.vercel.app/oauth/consent`
- In Supabase: go to Authentication → Settings → Redirect URLs and add the URL above. Ensure the path `/oauth/consent` is included exactly (not just the root domain).

6) Verify production
- Visit the production URL (https://fit-track-faetschi.vercel.app) and repeat the login flow. After OAuth you should be redirected to `/oauth/consent` and then to `/home`.

Notes and troubleshooting
- If the app fails to finish login on `/oauth/consent`, check the browser console and the network requests for the OAuth callback and token exchange.
- Confirm the environment variables on Vercel match the values used for local testing and that there are no typos in the redirect URL.

Additional production deployment checklist

- Ensure Vercel Project Environment Variables are set for Production (and Preview if you want PR previews):
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

- Typical production deploy flow (push + PR):

```bash
# from your feature branch
git add -A
git commit -m "feat: my changes"
git push origin feat/my-feature
# open PR on GitHub, review and merge to main
```

- After merge to `main`, Vercel will build and deploy automatically if repository is connected.

- Manual production deploy with Vercel CLI:

```bash
npm i -g vercel
vercel --prod
```

- After deployment, add the exact production redirect URL in Supabase Auth settings (example):
  - `https://fit-track-faetschi.vercel.app/oauth/consent`

- Verify the deployed site:
  - Open the deployed site and run through the login flow (use an Incognito window to avoid cached sessions)
  - Inspect Network tab for requests to `${SUPABASE_URL}` and ensure no CORS or 401 errors

- Rollbacks & logs:
  - Use Vercel dashboard to view deployment logs, timelines, and to rollback to a previous deployment if needed.

