CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_type ENUM('individual', 'company') NOT NULL,
  customer_code VARCHAR(80) NOT NULL,
  full_name VARCHAR(150) NULL,
  preferred_name VARCHAR(120) NULL,
  legal_name VARCHAR(180) NULL,
  trade_name VARCHAR(150) NULL,
  tax_number VARCHAR(60) NULL,
  identity_document VARCHAR(80) NULL,
  state_registration VARCHAR(80) NULL,
  municipal_registration VARCHAR(80) NULL,
  birth_date DATE NULL,
  gender ENUM('male', 'female', 'other', 'not_informed') NOT NULL DEFAULT 'not_informed',
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  secondary_phone VARCHAR(30) NULL,
  whatsapp VARCHAR(30) NULL,
  website VARCHAR(180) NULL,
  preferred_contact_method ENUM('phone', 'whatsapp', 'email', 'sms', 'none') NOT NULL DEFAULT 'none',
  language VARCHAR(20) NOT NULL DEFAULT 'pt-PT',
  notes TEXT NULL,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_terms_days INT UNSIGNED NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  block_reason VARCHAR(255) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_tenant_id (tenant_id, id),
  UNIQUE KEY uq_customers_tenant_code (tenant_id, customer_code),
  UNIQUE KEY uq_customers_tenant_tax (tenant_id, tax_number),
  KEY idx_customers_type_status (tenant_id, customer_type, status),
  KEY idx_customers_blocked (tenant_id, is_blocked),
  KEY idx_customers_created (tenant_id, created_at),
  CONSTRAINT fk_customers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_customers_credit_limit CHECK (credit_limit >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_contacts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  contact_type ENUM('personal', 'commercial', 'administrative', 'financial', 'billing', 'technical', 'emergency', 'other') NOT NULL DEFAULT 'personal',
  name VARCHAR(150) NOT NULL,
  position VARCHAR(120) NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  whatsapp VARCHAR(30) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  receives_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_contacts_tenant_id (tenant_id, id),
  KEY idx_customer_contacts_customer (tenant_id, customer_id, status),
  CONSTRAINT fk_customer_contacts_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  address_type ENUM('residential', 'commercial', 'billing', 'service', 'correspondence', 'other') NOT NULL DEFAULT 'residential',
  label VARCHAR(120) NULL,
  postal_code VARCHAR(30) NULL,
  address VARCHAR(180) NOT NULL,
  address_number VARCHAR(30) NULL,
  address_complement VARCHAR(120) NULL,
  neighborhood VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  state VARCHAR(120) NULL,
  country VARCHAR(120) NULL DEFAULT 'Portugal',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_billing BOOLEAN NOT NULL DEFAULT FALSE,
  is_service_location BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  notes TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_addresses_tenant_id (tenant_id, id),
  KEY idx_customer_addresses_customer (tenant_id, customer_id, status),
  KEY idx_customer_addresses_city (tenant_id, city, state, country),
  CONSTRAINT fk_customer_addresses_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  document_type ENUM('identity', 'tax', 'driver_license', 'company_registration', 'insurance', 'contract', 'authorization', 'other') NOT NULL,
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
  UNIQUE KEY uq_customer_document_number (tenant_id, customer_id, document_type, document_number),
  KEY idx_customer_documents_customer (tenant_id, customer_id, status),
  KEY idx_customer_documents_expiry (tenant_id, expiry_date),
  CONSTRAINT fk_customer_documents_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_customer_documents_dates CHECK (expiry_date IS NULL OR issue_date IS NULL OR expiry_date >= issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_consents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  consent_type ENUM('privacy_policy', 'marketing_email', 'marketing_sms', 'marketing_whatsapp', 'service_reminders', 'data_processing', 'third_party_sharing', 'other') NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  source ENUM('manual', 'paper', 'email', 'website', 'phone', 'other') NOT NULL DEFAULT 'manual',
  granted_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customer_consents_customer (tenant_id, customer_id, consent_type, created_at),
  CONSTRAINT fk_customer_consents_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_preferences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  preferred_contact_method ENUM('phone', 'whatsapp', 'email', 'sms', 'none') NOT NULL DEFAULT 'none',
  preferred_contact_time VARCHAR(40) NULL,
  language VARCHAR(20) NOT NULL DEFAULT 'pt-PT',
  allow_service_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  allow_promotions BOOLEAN NOT NULL DEFAULT FALSE,
  allow_satisfaction_surveys BOOLEAN NOT NULL DEFAULT TRUE,
  invoice_delivery_method ENUM('email', 'paper', 'portal', 'none') NOT NULL DEFAULT 'email',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_preferences_customer (tenant_id, customer_id),
  CONSTRAINT fk_customer_preferences_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  note_type ENUM('general', 'commercial', 'financial', 'service', 'complaint', 'preference', 'other') NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_customer_notes_customer (tenant_id, customer_id, is_confidential),
  CONSTRAINT fk_customer_notes_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  previous_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NULL,
  previous_blocked BOOLEAN NULL,
  new_blocked BOOLEAN NULL,
  reason VARCHAR(255) NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customer_status_history (tenant_id, customer_id, created_at),
  CONSTRAINT fk_customer_status_history_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_change_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  change_type VARCHAR(80) NOT NULL,
  summary VARCHAR(255) NULL,
  changed_fields_json JSON NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customer_change_history (tenant_id, customer_id, created_at),
  CONSTRAINT fk_customer_change_history_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_relationships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  related_customer_id BIGINT UNSIGNED NOT NULL,
  relationship_type ENUM('company_contact', 'family', 'fleet_manager', 'billing_responsible', 'legal_representative', 'partner', 'other') NOT NULL DEFAULT 'other',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_relationship (tenant_id, customer_id, related_customer_id, relationship_type),
  KEY idx_customer_relationship_related (tenant_id, related_customer_id),
  CONSTRAINT fk_customer_relationship_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_customer_relationship_related FOREIGN KEY (tenant_id, related_customer_id) REFERENCES customers (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
