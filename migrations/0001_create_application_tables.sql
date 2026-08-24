PRAGMA foreign_keys = ON;

CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL CHECK (service_type IN ('direct_application', 'consultation')),
  chinese_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  line_id TEXT NOT NULL DEFAULT '',
  current_location TEXT NOT NULL,
  preferred_city TEXT NOT NULL,
  preferred_school TEXT NOT NULL DEFAULT '',
  custom_school TEXT NOT NULL DEFAULT '',
  course_type TEXT NOT NULL,
  expected_start_month TEXT NOT NULL,
  course_duration TEXT NOT NULL,
  class_schedule TEXT NOT NULL DEFAULT '',
  accommodation_needed TEXT NOT NULL,
  partner_accommodation_interest TEXT NOT NULL DEFAULT '',
  quote_status TEXT NOT NULL DEFAULT '',
  decision_stage TEXT NOT NULL DEFAULT '',
  consultation_goal TEXT NOT NULL DEFAULT '',
  budget_range TEXT NOT NULL,
  additional_notes TEXT NOT NULL DEFAULT '',
  discovery_source TEXT NOT NULL DEFAULT '',
  agreements_json TEXT NOT NULL CHECK (json_valid(agreements_json)),
  agreement_version TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  utm_content TEXT NOT NULL DEFAULT '',
  utm_term TEXT NOT NULL DEFAULT '',
  gclid TEXT NOT NULL DEFAULT '',
  landing_page_url TEXT NOT NULL DEFAULT '',
  isic_initially_eligible INTEGER NOT NULL DEFAULT 0 CHECK (isic_initially_eligible IN (0, 1)),
  isic_eligibility_status TEXT NOT NULL DEFAULT 'pending' CHECK (isic_eligibility_status IN ('pending', 'eligible', 'requires_documents', 'not_eligible')),
  isic_notes TEXT NOT NULL DEFAULT '',
  crm_status TEXT NOT NULL DEFAULT 'new' CHECK (crm_status IN ('new', 'contacted', 'qualified', 'quoted', 'deposit_pending', 'enrolled', 'closed_lost')),
  assigned_to TEXT NOT NULL DEFAULT '',
  internal_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX applications_created_at_idx ON applications (created_at DESC);
CREATE INDEX applications_email_idx ON applications (email);
CREATE INDEX applications_crm_status_idx ON applications (crm_status, created_at DESC);
CREATE INDEX applications_service_type_idx ON applications (service_type, created_at DESC);

CREATE TABLE integration_jobs (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('student_email', 'internal_email', 'notion_sync')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT NOT NULL DEFAULT '',
  next_retry_at TEXT,
  provider_message_id TEXT,
  notion_page_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  UNIQUE (application_id, job_type)
);

CREATE INDEX integration_jobs_status_idx ON integration_jobs (status, next_retry_at);
CREATE INDEX integration_jobs_application_idx ON integration_jobs (application_id);
