-- Stream Postgres changes for `notifications` via Realtime (same as toggling the table
-- in Dashboard → Database → Publications → supabase_realtime). Idempotent.
DO
$$
  BEGIN
    IF NOT EXISTS (
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
