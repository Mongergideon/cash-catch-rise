-- Fix critical security issues by enabling RLS on tables that have policies but RLS disabled

-- Check and enable RLS on all public tables that should have it
DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- Enable RLS on all public tables that don't have it enabled
    FOR table_name IN 
        SELECT schemaname||'.'||tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE t.schemaname = 'public' 
            AND c.relrowsecurity = true
        )
    LOOP
        EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Enabled RLS on table: %', table_name;
    END LOOP;
END $$;