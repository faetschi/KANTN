const fs = require('fs');
const path = require('path');

const env = Object.assign({}, process.env);

// Load .env from project root if present (simple parser)
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    const normalize = (rawVal) => {
      if (rawVal === undefined || rawVal === null) return '';
      let v = String(rawVal).trim();
      // strip trailing semicolon
      v = v.replace(/;$/, '').trim();
      // strip surrounding matching quotes
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1).trim();
      }
      // final trim of stray quotes
      v = v.replace(/^['\"]|['\"]$/g, '').trim();
      return v;
    };

    raw.split(/\r?\n/).forEach((line) => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const idx = line.indexOf('=');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      val = normalize(val);
      if (env[key] === undefined) env[key] = val;
    });
  }
} catch (e) {
  // ignore parse errors
}

const outDir = path.resolve(process.cwd(), 'public');
const outPath = path.join(outDir, 'env.js');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const payload = {
  SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '',
  ENABLE_DEV_AUTH: env.ENABLE_DEV_AUTH || 'false',
  APP_URL: env.APP_URL || '',
};

// Fail the build on CI / Vercel when critical env vars are missing so deployments don't silently
// succeed without `env.js` populated. Vercel sets the `VERCEL` env var to '1'.
const isCI = !!process.env.CI || process.env.VERCEL === '1';
if (isCI) {
  const missing = [];
  if (!payload.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!payload.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  if (missing.length) {
    console.error('[generate-env] Missing required env vars:', missing.join(', '));
    console.error('[generate-env] Aborting build to avoid deploying without env.js');
    process.exit(1);
  }
}

const content = `<script>window.__env = ${JSON.stringify(payload)};</script>`;

// Inject into src/index.html
const indexPath = path.resolve(process.cwd(), 'src', 'index.html');
if (fs.existsSync(indexPath)) {
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  const startMarker = '<!-- ENV_INJECT_START -->';
  const endMarker = '<!-- ENV_INJECT_END -->';
  
  const startIndex = indexHtml.indexOf(startMarker);
  const endIndex = indexHtml.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    indexHtml = indexHtml.substring(0, startIndex + startMarker.length) + '\n    ' + content + '\n    ' + indexHtml.substring(endIndex);
    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log('[generate-env] injected env into', indexPath);
  } else {
    console.warn('[generate-env] Could not find injection markers in index.html');
  }
} else {
  console.warn('[generate-env] Could not find src/index.html');
}
