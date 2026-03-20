-- Migration: 003_cleanup_schedule
-- Description: Adds pg_cron job for automatic cleanup of expired device flow sessions
-- Created: 2026-03-17
-- Note: Requires Supabase Pro plan ($25/mo) or self-hosted Supabase with pg_cron enabled

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job to run every hour
SELECT cron.schedule(
  'cleanup-device-flow-sessions-hourly',
  '0 * * * *',  -- Every hour at minute 0
  $$DELETE FROM device_flow_sessions WHERE expires_at < NOW()$$
);

-- Optional: Also clean up old completed webhooks (30+ days)
SELECT cron.schedule(
  'cleanup-webhooks-daily',
  '0 3 * * *',  -- 3 AM UTC daily
  $$DELETE FROM webhook_deliveries WHERE created_at < NOW() - INTERVAL '30 days' AND status = 'completed'$$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- To unschedule a job (if needed):
-- SELECT cron.unschedule('cleanup-device-flow-sessions-hourly');
