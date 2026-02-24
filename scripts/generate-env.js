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
const tsOutDir = path.resolve(process.cwd(), 'src/app/core/generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(tsOutDir)) fs.mkdirSync(tsOutDir, { recursive: true });

const payload = {
  SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '',
  ENABLE_DEV_AUTH: env.ENABLE_DEV_AUTH || 'false',
  APP_URL: env.APP_URL || '',
};

const content = `window.__env = ${JSON.stringify(payload)};`;
fs.writeFileSync(outPath, content, 'utf8');
const tsContent = `export const runtimeEnv = ${JSON.stringify(payload, null, 2)} as const;\n`;
console.log('[generate-env] wrote', outPath);
