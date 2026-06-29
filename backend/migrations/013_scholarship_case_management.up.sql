-- ============================================================
-- Migration 013: Scholarship Case Management
-- ============================================================

CREATE TABLE scholarship_timeline (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status_from    VARCHAR(20),
    status_to      VARCHAR(20),
    title          VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sch_timeline_app ON scholarship_timeline(application_id);
CREATE INDEX idx_sch_timeline_user ON scholarship_timeline(user_id);

CREATE TABLE scholarship_messages (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
    sender_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message        TEXT NOT NULL,
    is_internal    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sch_messages_app ON scholarship_messages(application_id);
CREATE INDEX idx_sch_messages_sender ON scholarship_messages(sender_id);
