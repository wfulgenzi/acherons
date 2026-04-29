-- Stream Postgres changes for `notifications` via Realtime (same as toggling the table
-- in Dashboard → Database → Publications → supabase_realtime). Idempotent.
-- No-op when the `supabase_realtime` publication does not exist (vanilla Postgres).
DO
$$
  BEGIN
    IF EXISTS (
      SELECT
        1
      FROM
        pg_publication
      WHERE
        pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
      SELECT
        1
      FROM
        pg_publication_tables
      WHERE
        pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime
        ADD TABLE public.notifications;
    END IF;
  END
$$;
