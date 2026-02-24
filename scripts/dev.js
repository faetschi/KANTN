#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Build a single shell command to run via the user's shell. Using a shell
// avoids platform-specific issues with spawning `npx`/`.cmd` directly.
const baseCmd = 'npx ng serve --port=3000 --host=0.0.0.0';
const cmd = process.env.DISABLE_HMR ? baseCmd + ' --live-reload=false' : baseCmd;

// Ensure NG_ALLOWED_HOSTS includes localhost for SSR host validation during dev.
const env = Object.assign({}, process.env);

// Load .env from project root if present (simple parser)
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    const normalize = (rawVal) => {
      if (rawVal === undefined || rawVal === null) return '';
      let v = String(rawVal).trim();
      v = v.replace(/;$/, '').trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1).trim();
      }
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
      env[key] = val;
    });
  }
} catch (e) {
  // ignore parse errors
}

// Generate public/env.js from the resolved env values
try {
  const outDir = path.resolve(process.cwd(), 'public');
  const outPath = path.join(outDir, 'env.js');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const payload = {
    SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '',
    ENABLE_DEV_AUTH: env.ENABLE_DEV_AUTH || 'false',
    APP_URL: env.APP_URL || '',
  };

  const content = `window.__env = ${JSON.stringify(payload)};`;
  fs.writeFileSync(outPath, content, 'utf8');
} catch (e) {
  // ignore env.js generation errors
}

const allowedHosts = new Set(
  (env.NG_ALLOWED_HOSTS ? env.NG_ALLOWED_HOSTS.split(',') : ['localhost', 'localhost:3000', '127.0.0.1'])
    .map((h) => h.trim())
    .filter(Boolean)
);

// Add local network IPv4 addresses so SSR host checks allow LAN access during dev.
const nets = os.networkInterfaces();
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === 'IPv4' && !net.internal) {
      allowedHosts.add(net.address);
      allowedHosts.add(`${net.address}:3000`);
    }
  }
}

allowedHosts.add('0.0.0.0');
env.NG_ALLOWED_HOSTS = Array.from(allowedHosts).join(',');

const child = spawn(cmd, { stdio: 'inherit', shell: true, env });
child.on('exit', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('[dev] failed to start ng serve:', err && err.message);
  process.exit(1);
});
