-- Enable RLS on all tenant-scoped tables
ALTER TABLE requests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_clinic_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_profiles       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REQUESTS
-- ============================================================

CREATE POLICY "requests_dispatcher_select" ON requests
  FOR SELECT USING (
    dispatcher_org_id = current_setting('app.org_id', true)::uuid
  );

CREATE POLICY "requests_clinic_select" ON requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM request_clinic_access rca
      WHERE rca.request_id    = requests.id
        AND rca.clinic_org_id = current_setting('app.org_id', true)::uuid
    )
  );

CREATE POLICY "requests_dispatcher_insert" ON requests
  FOR INSERT WITH CHECK (
    dispatcher_org_id = current_setting('app.org_id', true)::uuid
  );

CREATE POLICY "requests_dispatcher_update" ON requests
  FOR UPDATE USING (
    dispatcher_org_id = current_setting('app.org_id', true)::uuid
  );

-- ============================================================
-- PROPOSALS
-- ============================================================

CREATE POLICY "proposals_select" ON proposals
  FOR SELECT USING (
    clinic_org_id        = current_setting('app.org_id', true)::uuid
    OR dispatcher_org_id = current_setting('app.org_id', true)::uuid
  );

CREATE POLICY "proposals_clinic_insert" ON proposals
  FOR INSERT WITH CHECK (
    clinic_org_id = current_setting('app.org_id', true)::uuid
  );

CREATE POLICY "proposals_clinic_update" ON proposals
  FOR UPDATE USING (
    clinic_org_id = current_setting('app.org_id', true)::uuid
  );

-- ============================================================
-- BOOKINGS
-- ============================================================

CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    dispatcher_org_id = current_setting('app.org_id', true)::uuid
    OR clinic_org_id  = current_setting('app.org_id', true)::uuid
  );

CREATE POLICY "bookings_dispatcher_insert" ON bookings
  FOR INSERT WITH CHECK (
    dispatcher_org_id = current_setting('app.org_id', true)::uuid
  );

-- ============================================================
-- MEMBERSHIPS
-- ============================================================

CREATE POLICY "memberships_own_select" ON memberships
  FOR SELECT USING (
    user_id = current_setting('app.user_id', true)
  );

CREATE POLICY "memberships_org_insert" ON memberships
  FOR INSERT WITH CHECK (
    org_id = current_setting('app.org_id', true)::uuid
  );

-- ============================================================
-- REQUEST_CLINIC_ACCESS
-- request_clinic_access carries dispatcher_org_id directly,
-- so no cross-table lookup is needed (avoids RLS recursion with requests).
-- ============================================================

CREATE POLICY "rca_dispatcher_all" ON request_clinic_access
  FOR ALL USING (
    dispatcher_org_id = current_setting('app.org_id', true)::uuid
  ) WITH CHECK (
    dispatcher_org_id = current_setting('app.org_id', true)::uuid
  );

CREATE POLICY "rca_clinic_select" ON request_clinic_access
  FOR SELECT USING (
    clinic_org_id = current_setting('app.org_id', true)::uuid
  );

-- ============================================================
-- ORGANISATIONS
-- ============================================================

CREATE POLICY "organisations_authenticated_select" ON organisations
  FOR SELECT USING (
    current_setting('app.user_id', true) IS NOT NULL
    AND current_setting('app.user_id', true) <> ''
  );

CREATE POLICY "organisations_own_update" ON organisations
  FOR UPDATE USING (
    id = current_setting('app.org_id', true)::uuid
  );

-- ============================================================
-- CLINIC_PROFILES
-- ============================================================

CREATE POLICY "clinic_profiles_authenticated_select" ON clinic_profiles
  FOR SELECT USING (
    current_setting('app.user_id', true) IS NOT NULL
    AND current_setting('app.user_id', true) <> ''
  );

CREATE POLICY "clinic_profiles_own_insert" ON clinic_profiles
  FOR INSERT WITH CHECK (
    org_id = current_setting('app.org_id', true)::uuid
  );

CREATE POLICY "clinic_profiles_own_update" ON clinic_profiles
  FOR UPDATE USING (
    org_id = current_setting('app.org_id', true)::uuid
  );
