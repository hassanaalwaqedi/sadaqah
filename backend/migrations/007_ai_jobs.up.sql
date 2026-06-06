CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payload JSONB NOT NULL,
    result JSONB,
    error_msg TEXT,
    retries INT NOT NULL DEFAULT 0,
    progress INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON ai_jobs(job_type);
