PRODUCTION DEPLOYMENT
=====================

This document explains how to verify the OAuth login flow locally and deploy the app to Vercel for production.

1) Test locally (OAuth flow)
- Install and run the app using your normal local dev commands (example):
  - `npm install`
  - `npm run dev` or `npm start` (use whatever command the project uses for local development)
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

Want me to push and open the PR for you?
