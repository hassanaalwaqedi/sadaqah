-- Add Case Worker Assignment fields to scholarship_applications
ALTER TABLE scholarship_applications
ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN department VARCHAR(100),
ADD COLUMN committee VARCHAR(100),
ADD COLUMN priority VARCHAR(20) DEFAULT 'normal',
ADD COLUMN sla_deadline TIMESTAMPTZ;

CREATE INDEX idx_scholarship_applications_assigned_to ON scholarship_applications(assigned_to);
CREATE INDEX idx_scholarship_applications_priority ON scholarship_applications(priority);
