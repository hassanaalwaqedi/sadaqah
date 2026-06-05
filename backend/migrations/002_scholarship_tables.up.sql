-- ============================================================
-- Migration 002: Scholarship Tables
-- ============================================================

-- ── Scholarship Cycles ──
CREATE TABLE scholarship_cycles (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en              VARCHAR(200) NOT NULL,
    name_ar              VARCHAR(200) NOT NULL,
    description          TEXT,
    academic_year        VARCHAR(9) NOT NULL,
    application_start    TIMESTAMPTZ NOT NULL,
    application_deadline TIMESTAMPTZ NOT NULL,
    evaluation_deadline  TIMESTAMPTZ,
    total_quota          INTEGER NOT NULL,
    status               VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'open', 'closed', 'evaluating', 'completed')),
    created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_sch_cycles_status ON scholarship_cycles(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sch_cycles_year ON scholarship_cycles(academic_year);

-- ── Scholarship Criteria ──
CREATE TABLE scholarship_criteria (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id    UUID NOT NULL REFERENCES scholarship_cycles(id) ON DELETE CASCADE,
    name_en     VARCHAR(200) NOT NULL,
    name_ar     VARCHAR(200) NOT NULL,
    description TEXT,
    weight      DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    max_score   DECIMAL(5,2) NOT NULL,
    data_source VARCHAR(50) CHECK (data_source IN ('manual', 'ocr', 'computed')),
    sort_order  SMALLINT NOT NULL
);

CREATE INDEX idx_sch_criteria_cycle ON scholarship_criteria(cycle_id);

-- ── Scholarship Applications ──
CREATE TABLE scholarship_applications (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id              UUID NOT NULL REFERENCES scholarship_cycles(id) ON DELETE RESTRICT,
    applicant_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status                VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'evaluation', 'ranked', 'accepted', 'rejected', 'withdrawn')),
    submitted_at          TIMESTAMPTZ,
    gpa_verified          DECIMAL(4,2),
    family_income         DECIMAL(12,2),
    family_size           SMALLINT,
    distance_km           DECIMAL(8,2),
    special_circumstances TEXT,
    admin_notes           TEXT,
    final_score           DECIMAL(8,4),
    final_rank            INTEGER,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ,
    UNIQUE(cycle_id, applicant_id)
);

CREATE INDEX idx_sch_app_cycle_status ON scholarship_applications(cycle_id, status);
CREATE INDEX idx_sch_app_applicant ON scholarship_applications(applicant_id);

-- ── Application Documents ──
CREATE TABLE application_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
    file_id         UUID NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
    document_type   VARCHAR(50) NOT NULL,
    ocr_task_id     UUID,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_docs_application ON application_documents(application_id);

-- ── Evaluations ──
CREATE TABLE evaluations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
    judge_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('assigned', 'in_progress', 'completed')),
    total_score     DECIMAL(8,4),
    comments        TEXT,
    evaluated_at    TIMESTAMPTZ,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(application_id, judge_id)
);

CREATE INDEX idx_eval_judge_status ON evaluations(judge_id, status);
CREATE INDEX idx_eval_application ON evaluations(application_id);

-- ── Evaluation Scores ──
CREATE TABLE evaluation_scores (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    criteria_id   UUID NOT NULL REFERENCES scholarship_criteria(id) ON DELETE CASCADE,
    score         DECIMAL(5,2) NOT NULL,
    notes         TEXT
);

CREATE INDEX idx_eval_scores_eval ON evaluation_scores(evaluation_id);

-- ── OCR Tasks ──
CREATE TABLE ocr_tasks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID NOT NULL REFERENCES application_documents(id) ON DELETE CASCADE,
    status       VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'manual_review')),
    queued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at   TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count  SMALLINT DEFAULT 0
);

CREATE INDEX idx_ocr_status ON ocr_tasks(status);

-- ── OCR Results ──
CREATE TABLE ocr_results (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id          UUID NOT NULL REFERENCES ocr_tasks(id) ON DELETE CASCADE,
    raw_text         TEXT,
    extracted_data   JSONB NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    needs_review     BOOLEAN DEFAULT false,
    reviewed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ocr_results_task ON ocr_results(task_id);

-- ── Ranking Results ──
CREATE TABLE ranking_results (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id    UUID NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
    cycle_id          UUID NOT NULL REFERENCES scholarship_cycles(id) ON DELETE CASCADE,
    total_score       DECIMAL(8,4) NOT NULL,
    rank              INTEGER NOT NULL,
    criteria_breakdown JSONB NOT NULL,
    ranked_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ranking_cycle ON ranking_results(cycle_id, rank);
CREATE INDEX idx_ranking_application ON ranking_results(application_id);

-- Add FK from application_documents to ocr_tasks
ALTER TABLE application_documents
    ADD CONSTRAINT fk_app_doc_ocr FOREIGN KEY (ocr_task_id) REFERENCES ocr_tasks(id) ON DELETE SET NULL;
