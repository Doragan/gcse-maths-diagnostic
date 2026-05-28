-- Analytics events table
-- Tracks page views, registration funnel steps, and diagnostic engagement.
-- RLS: anyone (including anon) can INSERT; only the service role can SELECT
-- (query via the Supabase dashboard or a server-side API route).

CREATE TABLE IF NOT EXISTS analytics_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event      text        NOT NULL,
  path       text,
  session_id text        NOT NULL,
  properties jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_created
  ON analytics_events (event, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_session
  ON analytics_events (session_id);

CREATE INDEX IF NOT EXISTS analytics_events_created
  ON analytics_events (created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow any visitor (anon or authenticated) to record events
CREATE POLICY "anon_insert_analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- No SELECT policy for normal users → only service role can read
-- (Supabase dashboard uses service role automatically)
