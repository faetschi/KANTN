# BEFORE executing init_supabase.sql in database:

ALL tables are dropped at execution (at the start of the script), so no corrupted data.

This might need future adjustments (so it doesnt reset profiles table, which includes user approval + admin)