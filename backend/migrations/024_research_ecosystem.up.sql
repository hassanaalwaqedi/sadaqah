-- Migration 024: Research Ecosystem

-- 1. Modify innovation_events to support event_type
ALTER TABLE innovation_events ADD COLUMN event_type VARCHAR(50) NOT NULL DEFAULT 'innovation';

-- 2. Research Grant Programs (Calls for Proposals)
CREATE TABLE research_grant_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    description TEXT,
    total_budget_pool DECIMAL(14,2) NOT NULL,
    max_budget_per_project DECIMAL(14,2),
    application_start TIMESTAMPTZ NOT NULL,
    application_deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'open', 'evaluating', 'closed')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Research Projects
CREATE TABLE research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_program_id UUID REFERENCES research_grant_programs(id) ON DELETE SET NULL,
    title VARCHAR(300) NOT NULL,
    abstract TEXT NOT NULL,
    requested_budget DECIMAL(14,2) NOT NULL,
    approved_budget DECIMAL(14,2),
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'active', 'completed', 'rejected', 'cancelled')),
    start_date DATE,
    end_date DATE,
    extra_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. Research Team Members
CREATE TABLE research_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- e.g., 'pi', 'co_pi', 'researcher', 'student'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 5. Research Publications
CREATE TABLE research_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES research_projects(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    publication_type VARCHAR(50) NOT NULL, -- 'journal', 'conference', 'book', 'dataset', 'patent'
    journal_name VARCHAR(200),
    publication_date DATE,
    doi VARCHAR(100),
    abstract TEXT,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mock Data for Dashboard

INSERT INTO research_grant_programs (id, name_en, name_ar, description, total_budget_pool, application_start, application_deadline, status) VALUES
('b1111111-1111-1111-1111-111111111111', 'Advanced AI Research Grant 2026', '???? ????? ?????? ????????? ???????? 2026', 'Funding for cutting-edge AI research', 1000000.00, NOW(), NOW() + INTERVAL '30 days', 'open');

INSERT INTO research_projects (id, grant_program_id, title, abstract, requested_budget, approved_budget, status, start_date) VALUES
('b2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Deep Learning for Medical Diagnosis', 'Applying LLMs to medical records.', 150000.00, 150000.00, 'active', CURRENT_DATE),
('b3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Quantum Computing Cryptography', 'Post-quantum algorithms for securing communications.', 250000.00, 200000.00, 'active', CURRENT_DATE);

INSERT INTO research_publications (id, project_id, user_id, title, publication_type, journal_name, publication_date, doi, status) VALUES
('b4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', (SELECT id FROM users LIMIT 1), 'Attention Mechanisms in Healthcare', 'journal', 'Nature Medicine AI', CURRENT_DATE, '10.1038/s41591-026-0000-1', 'published');

INSERT INTO innovation_events (id, name_en, name_ar, description, event_date, submission_deadline, status, event_type) VALUES
('b5555555-5555-5555-5555-555555555555', 'International Conference on Sustainable Development', '??????? ?????? ??????? ?????????', 'Annual conference calling for papers in sustainability.', CURRENT_DATE + INTERVAL '90 days', CURRENT_DATE + INTERVAL '30 days', 'open', 'conference');

