-- 026_universal_profiles.up.sql

-- 1. Create User Interests table
CREATE TABLE IF NOT EXISTS user_interests (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interest VARCHAR(50) NOT NULL, -- 'student', 'scholarship', 'researcher', 'innovation', 'donor', 'volunteer', 'judge', 'reviewer', 'employer', 'academic', 'partner'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, interest)
);

-- 2. Create User Documents (Profile Vault)
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'id_card', 'passport', 'student_card', 'transcript', 'certificate', 'cv', 'recommendation', 'language_cert', 'other'
    file_url VARCHAR(512) NOT NULL,
    metadata JSONB DEFAULT '{}',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Specialized Profile Tables

-- Donor Profile
CREATE TABLE IF NOT EXISTS donor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    donor_type VARCHAR(50) DEFAULT 'individual', -- 'individual', 'corporate'
    company_name VARCHAR(200),
    preferred_causes TEXT[], -- e.g. ['education', 'housing', 'research']
    is_anonymous BOOLEAN DEFAULT false,
    tax_receipt_required BOOLEAN DEFAULT false,
    total_donated DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Researcher Profile
CREATE TABLE IF NOT EXISTS researcher_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    academic_title VARCHAR(100),
    institution VARCHAR(200),
    department VARCHAR(200),
    research_fields TEXT[],
    orcid_id VARCHAR(100),
    google_scholar_url VARCHAR(255),
    publications_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Innovation Profile
CREATE TABLE IF NOT EXISTS innovation_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT[],
    portfolio_url VARCHAR(255),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    previous_projects TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer Profile
CREATE TABLE IF NOT EXISTS volunteer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT[],
    availability VARCHAR(100), -- 'weekends', 'evenings', 'full_time'
    preferred_roles TEXT[],
    total_hours INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge/Reviewer Profile (Combined or separate, we'll keep them separate for now as requested)
CREATE TABLE IF NOT EXISTS judge_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    expertise_areas TEXT[],
    industry VARCHAR(100),
    years_of_experience INT,
    company VARCHAR(200),
    job_title VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviewer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    academic_focus TEXT[],
    institution VARCHAR(200),
    peer_review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Profile
CREATE TABLE IF NOT EXISTS employee_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) UNIQUE,
    department VARCHAR(100),
    job_title VARCHAR(100),
    hire_date DATE,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
