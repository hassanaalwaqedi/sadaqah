-- ============================================================
-- Migration 017: Enterprise Notifications
-- ============================================================

DROP TABLE IF EXISTS system_events CASCADE;

CREATE TABLE system_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type     VARCHAR(100) NOT NULL,
    source_module  VARCHAR(50) NOT NULL,
    target_id      UUID,     -- Context-specific target (e.g., application_id)
    actor_id       UUID,     -- Who triggered the event
    payload        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_events_type ON system_events(event_type);
CREATE INDEX idx_system_events_target ON system_events(target_id);

DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id    UUID REFERENCES system_events(id) ON DELETE SET NULL,
    type        VARCHAR(50) NOT NULL DEFAULT 'alert', -- alert, message, update
    priority    VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'success', 'warning', 'urgent', 'critical')),
    title       VARCHAR(300) NOT NULL,
    message     TEXT NOT NULL,
    link        VARCHAR(500),
    read_at     TIMESTAMPTZ,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC) WHERE deleted_at IS NULL;

DROP TABLE IF EXISTS notification_preferences CASCADE;

CREATE TABLE notification_preferences (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled    BOOLEAN NOT NULL DEFAULT true,
    push_enabled     BOOLEAN NOT NULL DEFAULT true,
    muted_categories TEXT[] DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
