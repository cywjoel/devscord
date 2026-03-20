-- Migration: 002_fix_device_flow_sessions_fk
-- Description: Removes foreign key constraint from device_flow_sessions.discord_id
-- Created: 2026-03-17
-- Reason: Users don't exist in users table until they complete OAuth flow

-- Drop the foreign key constraint
-- Note: Constraint name follows PostgreSQL naming convention: {table}_{column}_fkey
ALTER TABLE device_flow_sessions
    DROP CONSTRAINT IF EXISTS device_flow_sessions_discord_id_fkey;

-- Verify the constraint was dropped
-- This query should return 0 rows after the fix
SELECT conname
FROM pg_constraint
WHERE conrelid = 'device_flow_sessions'::regclass
  AND conname = 'device_flow_sessions_discord_id_fkey';
