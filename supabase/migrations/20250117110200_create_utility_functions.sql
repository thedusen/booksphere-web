-- Create utility functions for the notification processor
-- These functions provide advisory locking and configuration capabilities

-- Function to safely call pg_try_advisory_xact_lock with text input
CREATE OR REPLACE FUNCTION pg_try_advisory_xact_lock(key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN pg_try_advisory_xact_lock(hashtext(key));
END;
$$;

-- Function to set configuration values (wrapper for set_config)
CREATE OR REPLACE FUNCTION set_config(setting_name text, new_value text, is_local boolean DEFAULT true)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT set_config(setting_name, new_value, is_local);
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION pg_try_advisory_xact_lock(text) TO service_role;
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO service_role;

-- Function to get advisory lock status for monitoring
CREATE OR REPLACE FUNCTION get_advisory_lock_status()
RETURNS TABLE (
    locktype text,
    database oid,
    relation oid,
    page integer,
    tuple smallint,
    virtualxid text,
    transactionid xid,
    classid oid,
    objid oid,
    objsubid smallint,
    virtualtransaction text,
    pid integer,
    mode text,
    granted boolean,
    fastpath boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        l.locktype,
        l.database,
        l.relation,
        l.page,
        l.tuple,
        l.virtualxid,
        l.transactionid,
        l.classid,
        l.objid,
        l.objsubid,
        l.virtualtransaction,
        l.pid,
        l.mode,
        l.granted,
        l.fastpath
    FROM pg_locks l
    WHERE l.locktype = 'advisory'
    ORDER BY l.granted DESC, l.pid;
$$;

GRANT EXECUTE ON FUNCTION get_advisory_lock_status() TO service_role; 