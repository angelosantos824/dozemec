CREATE TABLE IF NOT EXISTS job_positions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  description TEXT NULL,
  default_commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  display_order INT NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_job_positions_tenant_id (tenant_id, id),
  UNIQUE KEY uq_job_positions_tenant_code (tenant_id, code),
  KEY idx_job_positions_tenant_status (tenant_id, status, display_order),
  CONSTRAINT fk_job_positions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_specialties (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  description TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  display_order INT NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employee_specialties_tenant_id (tenant_id, id),
  UNIQUE KEY uq_employee_specialties_tenant_code (tenant_id, code),
  KEY idx_employee_specialties_tenant_status (tenant_id, status, display_order),
  CONSTRAINT fk_employee_specialties_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  sector_id BIGINT UNSIGNED NULL,
  job_position_id BIGINT UNSIGNED NULL,
  employee_number VARCHAR(80) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  preferred_name VARCHAR(120) NULL,
  tax_number VARCHAR(50) NULL,
  identity_document VARCHAR(80) NULL,
  social_security_number VARCHAR(80) NULL,
  birth_date DATE NULL,
  gender ENUM('male', 'female', 'other', 'not_informed') NOT NULL DEFAULT 'not_informed',
  marital_status VARCHAR(60) NULL,
  nationality VARCHAR(80) NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  secondary_phone VARCHAR(30) NULL,
  whatsapp VARCHAR(30) NULL,
  postal_code VARCHAR(30) NULL,
  address VARCHAR(180) NULL,
  address_number VARCHAR(30) NULL,
  address_complement VARCHAR(120) NULL,
  neighborhood VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  state VARCHAR(120) NULL,
  country VARCHAR(120) NULL,
  photo_url VARCHAR(255) NULL,
  hire_date DATE NOT NULL,
  termination_date DATE NULL,
  employment_type ENUM('employee', 'contractor', 'temporary', 'intern', 'partner', 'other') NOT NULL DEFAULT 'employee',
  contract_status ENUM('active', 'probation', 'on_leave', 'suspended', 'terminated') NOT NULL DEFAULT 'active',
  base_salary DECIMAL(12,2) NULL,
  hourly_rate DECIMAL(12,2) NULL,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  emergency_contact_name VARCHAR(150) NULL,
  emergency_contact_relationship VARCHAR(80) NULL,
  emergency_contact_phone VARCHAR(30) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_tenant_id (tenant_id, id),
  UNIQUE KEY uq_employees_tenant_number (tenant_id, employee_number),
  UNIQUE KEY uq_employees_tenant_user (tenant_id, user_id),
  UNIQUE KEY uq_employees_tenant_tax (tenant_id, tax_number),
  KEY idx_employees_sector (tenant_id, sector_id),
  KEY idx_employees_job_position (tenant_id, job_position_id),
  KEY idx_employees_status_contract (tenant_id, status, contract_status),
  KEY idx_employees_hire_date (tenant_id, hire_date),
  KEY idx_employees_deleted_at (tenant_id, deleted_at),
  CONSTRAINT fk_employees_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_employees_user FOREIGN KEY (tenant_id, user_id) REFERENCES users (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_employees_sector FOREIGN KEY (tenant_id, sector_id) REFERENCES sectors (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_employees_job_position FOREIGN KEY (tenant_id, job_position_id) REFERENCES job_positions (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_employees_commission CHECK (commission_percentage BETWEEN 0 AND 100),
  CONSTRAINT chk_employees_salary CHECK (base_salary IS NULL OR base_salary >= 0),
  CONSTRAINT chk_employees_hourly CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
  CONSTRAINT chk_employees_termination CHECK (termination_date IS NULL OR termination_date >= hire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_specialty_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  specialty_id BIGINT UNSIGNED NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  experience_years DECIMAL(4,1) NOT NULL DEFAULT 0.0,
  certification_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employee_specialty_assignment (tenant_id, employee_id, specialty_id),
  KEY idx_employee_specialty_primary (tenant_id, employee_id, is_primary),
  CONSTRAINT fk_employee_specialty_assignment_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES employees (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_employee_specialty_assignment_specialty FOREIGN KEY (tenant_id, specialty_id) REFERENCES employee_specialties (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_employee_specialty_experience CHECK (experience_years >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_work_schedules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,
  is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
  start_time TIME NULL,
  lunch_start_time TIME NULL,
  lunch_end_time TIME NULL,
  end_time TIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employee_schedule_day (tenant_id, employee_id, day_of_week),
  CONSTRAINT fk_employee_schedule_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES employees (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_employee_schedule_day CHECK (day_of_week BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  document_type ENUM('identity', 'tax', 'driver_license', 'work_authorization', 'professional_certificate', 'safety_training', 'medical_certificate', 'contract', 'other') NOT NULL,
  document_number VARCHAR(120) NOT NULL,
  issue_date DATE NULL,
  expiry_date DATE NULL,
  file_url VARCHAR(255) NULL,
  notes TEXT NULL,
  status ENUM('valid', 'expired', 'pending', 'cancelled') NOT NULL DEFAULT 'pending',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employee_document_number (tenant_id, employee_id, document_type, document_number),
  KEY idx_employee_documents_employee (tenant_id, employee_id, status),
  KEY idx_employee_documents_expiry (tenant_id, expiry_date),
  CONSTRAINT fk_employee_documents_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES employees (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_employee_documents_dates CHECK (expiry_date IS NULL OR issue_date IS NULL OR expiry_date >= issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  previous_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NULL,
  previous_contract_status VARCHAR(40) NULL,
  new_contract_status VARCHAR(40) NULL,
  reason VARCHAR(255) NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employee_status_history (tenant_id, employee_id, created_at),
  CONSTRAINT fk_employee_status_history_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES employees (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_user_link_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  previous_user_id BIGINT UNSIGNED NULL,
  new_user_id BIGINT UNSIGNED NULL,
  reason VARCHAR(255) NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employee_user_link_history (tenant_id, employee_id, created_at),
  CONSTRAINT fk_employee_user_link_history_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES employees (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  note_type ENUM('general', 'performance', 'training', 'administrative', 'disciplinary', 'other') NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_employee_notes_employee (tenant_id, employee_id, is_confidential),
  CONSTRAINT fk_employee_notes_employee FOREIGN KEY (tenant_id, employee_id) REFERENCES employees (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
