import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const normalizeEnvValue = (value: string | undefined) => {
  if (value === undefined || value === null) return '';
  let normalized = String(value).trim();
  normalized = normalized.replace(/;$/, '').trim();
  if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.slice(1, -1).trim();
  }
  normalized = normalized.replace(/^['\"]|['\"]$/g, '').trim();
  return normalized;
};

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.get('/env.js', (_req, res) => {
  const payload = {
    SUPABASE_URL: normalizeEnvValue(process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL']),
    SUPABASE_ANON_KEY: normalizeEnvValue(process.env['SUPABASE_ANON_KEY'] || process.env['VITE_SUPABASE_ANON_KEY']),
    ENABLE_DEV_AUTH: normalizeEnvValue(process.env['ENABLE_DEV_AUTH']) || 'false',
    APP_URL: normalizeEnvValue(process.env['APP_URL']),
  };

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).send(`window.__env = ${JSON.stringify(payload)};`);
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
