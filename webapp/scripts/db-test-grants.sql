-- Role used as DATABASE_URL in integration tests (RLS enforced; not table owner).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'acherons_app') THEN
    CREATE ROLE acherons_app LOGIN PASSWORD 'acherons_app_test';
  ELSE
    ALTER ROLE acherons_app PASSWORD 'acherons_app_test';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE acherons_test TO acherons_app;
GRANT USAGE ON SCHEMA public TO acherons_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO acherons_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO acherons_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO acherons_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO acherons_app;
