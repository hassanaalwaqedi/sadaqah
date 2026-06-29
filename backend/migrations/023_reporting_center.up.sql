CREATE TABLE report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'scholarships', 'innovation', 'finance', 'custom'
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    format VARCHAR(20) NOT NULL, -- 'pdf', 'excel', 'csv'
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_history_type ON report_history(type);
CREATE INDEX idx_report_history_created_by ON report_history(created_by);

CREATE TABLE scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    cron_expression VARCHAR(50) NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of email addresses
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_reports_is_active ON scheduled_reports(is_active);
