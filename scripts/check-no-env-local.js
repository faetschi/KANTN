const { execSync } = require('child_process');

function fail(msg) {
  console.error('\n\x1b[31m[pre-commit] ERROR:\x1b[0m ' + msg + '\n');
  process.exit(1);
}

try {
  const out = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  const files = out.split(/\r?\n/).filter(Boolean);
  const blocked = files.filter((f) =>
    /(^|\/)\.env$/.test(f) ||
    /(^|\/)public\/env\.js$/.test(f)
  );
  if (blocked.length) {
    fail('Commit contains .env or public/env.js. Remove it from the commit and keep local-only files out of source control.\nBlocked files:\n' + blocked.join('\n'));
  }
  process.exit(0);
} catch (err) {
  console.error('[pre-commit] failed to check staged files', err && err.message);
  process.exit(1);
}
