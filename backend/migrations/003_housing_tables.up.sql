-- ============================================================
-- Migration 003: Housing Tables
-- ============================================================

CREATE TABLE buildings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en         VARCHAR(200) NOT NULL,
    name_ar         VARCHAR(200) NOT NULL,
    address         TEXT,
    total_capacity  INTEGER NOT NULL,
    gender          VARCHAR(10) CHECK (gender IN ('male', 'female', 'mixed')),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number    SMALLINT NOT NULL,
    name            VARCHAR(50),
    UNIQUE(building_id, floor_number)
);

CREATE TABLE rooms (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id          UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    room_number       VARCHAR(20) NOT NULL,
    room_type         VARCHAR(30) NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'quad', 'suite')),
    capacity          SMALLINT NOT NULL,
    current_occupancy SMALLINT DEFAULT 0,
    monthly_rent      DECIMAL(10,2) NOT NULL,
    amenities         JSONB DEFAULT '[]',
    is_available      BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(floor_id, room_number)
);

CREATE INDEX idx_rooms_available ON rooms(is_available) WHERE is_available = true;

CREATE TABLE housing_applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    academic_year       VARCHAR(9) NOT NULL,
    status              VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'allocated', 'withdrawn')),
    preferred_room_type VARCHAR(30),
    special_needs       TEXT,
    submitted_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_hsg_app_applicant ON housing_applications(applicant_id);
CREATE INDEX idx_hsg_app_status ON housing_applications(status) WHERE deleted_at IS NULL;

CREATE TABLE room_allocations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID REFERENCES housing_applications(id) ON DELETE SET NULL,
    room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    resident_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    lease_start     DATE NOT NULL,
    lease_end       DATE NOT NULL,
    check_in_at     TIMESTAMPTZ,
    check_out_at    TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('active', 'checked_out', 'evicted', 'transferred')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alloc_room_status ON room_allocations(room_id, status);
CREATE INDEX idx_alloc_resident ON room_allocations(resident_id);

CREATE TABLE rent_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id   UUID NOT NULL REFERENCES room_allocations(id) ON DELETE CASCADE,
    amount          DECIMAL(10,2) NOT NULL,
    payment_month   DATE NOT NULL,
    payment_date    TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
    payment_method  VARCHAR(30),
    transaction_ref VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rent_allocation ON rent_payments(allocation_id);
CREATE INDEX idx_rent_status ON rent_payments(status);

CREATE TABLE maintenance_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id   UUID NOT NULL REFERENCES room_allocations(id) ON DELETE CASCADE,
    category        VARCHAR(50) NOT NULL,
    description     TEXT NOT NULL,
    priority        VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status          VARCHAR(20) NOT NULL CHECK (status IN ('submitted', 'in_progress', 'resolved', 'closed')),
    resolved_at     TIMESTAMPTZ,
    resolver_notes  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maint_status ON maintenance_requests(status);

CREATE TABLE housing_violations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id   UUID NOT NULL REFERENCES room_allocations(id) ON DELETE CASCADE,
    violation_type  VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    severity        VARCHAR(10) NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
    action_taken    TEXT,
    issued_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
