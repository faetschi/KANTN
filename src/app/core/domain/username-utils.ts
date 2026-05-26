export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

export function makeDefaultUsername(input: { email?: string | null; displayName?: string | null; id?: string | null }): string {
  const rawBase = input.email?.split('@')[0] || input.displayName || 'user';
  const base = rawBase.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
  const suffix = (input.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
  if (!suffix) return base.slice(0, 20);

  const maxBaseLength = Math.max(3, 20 - suffix.length - 1);
  const trimmedBase = base.slice(0, maxBaseLength) || 'user';
  return `${trimmedBase}_${suffix}`;
}
