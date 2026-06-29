-- Migration 012: Innovation Evaluation & Tracking System

-- Track application lifecycle and timeline events
CREATE TABLE project_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- who made the change
    status_from VARCHAR(50),
    status_to VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messaging for projects (Admin/Judge <-> Applicant)
CREATE TABLE project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- If true, only visible to admins/judges
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certificates for projects
CREATE TABLE project_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_type VARCHAR(50) NOT NULL, -- winner, finalist, participation
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
