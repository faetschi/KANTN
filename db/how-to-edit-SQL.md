# Editing Guide for init_supabase.sql (PROD-safe)

This project treats `db/init_supabase.sql` as already executed on live production.

## Hard Rules

1. Never modify or delete existing SQL lines in `db/init_supabase.sql`.
2. Only append new SQL at the end of the file.
3. Schema changes must be additive and use `ALTER TABLE` statements.
4. Do not use destructive changes (`DROP`, column rename, type rewrite, table rebuild) in this file.
5. Every new change must be idempotent (safe to run multiple times).

## Allowed Pattern

Use only append-only, additive table changes:

```sql
-- YYYY-MM-DD: short reason
ALTER TABLE public.profiles
	ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE public.workout_sessions
	ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';
```

## Constraints and Indexes for New Columns

When needed, add follow-up statements (also append-only):

```sql
ALTER TABLE public.workout_sessions
	ADD CONSTRAINT workout_sessions_source_chk
	CHECK (source IN ('app', 'import'));

CREATE INDEX IF NOT EXISTS idx_workout_sessions_source
	ON public.workout_sessions (source);
```

## Review Checklist (before commit)

1. I only appended statements to `db/init_supabase.sql`.
2. I used `ALTER TABLE ... ADD ... IF NOT EXISTS` for schema additions.
3. I did not change any previously existing SQL.
4. New statements are rerunnable without failure.
