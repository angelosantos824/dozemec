ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS legal_name VARCHAR(150) NULL AFTER id,
  ADD COLUMN IF NOT EXISTS state_registration VARCHAR(80) NULL AFTER tax_number,
  ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(30) NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS website VARCHAR(180) NULL AFTER whatsapp,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(30) NULL AFTER website,
  ADD COLUMN IF NOT EXISTS address_number VARCHAR(30) NULL AFTER address,
  ADD COLUMN IF NOT EXISTS address_complement VARCHAR(120) NULL AFTER address_number,
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(120) NULL AFTER address_complement,
  ADD COLUMN IF NOT EXISTS city VARCHAR(120) NULL AFTER neighborhood,
  ADD COLUMN IF NOT EXISTS state VARCHAR(120) NULL AFTER city,
  ADD COLUMN IF NOT EXISTS country VARCHAR(120) NULL DEFAULT 'Portugal' AFTER state,
  ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(255) NULL AFTER logo_url,
  ADD COLUMN IF NOT EXISTS login_image_url VARCHAR(255) NULL AFTER favicon_url,
  ADD COLUMN IF NOT EXISTS dashboard_image_url VARCHAR(255) NULL AFTER login_image_url,
  ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) NULL AFTER secondary_color,
  ADD COLUMN IF NOT EXISTS theme ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'system' AFTER accent_color,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(80) NOT NULL DEFAULT 'Europe/Lisbon' AFTER theme,
  ADD COLUMN IF NOT EXISTS locale VARCHAR(20) NOT NULL DEFAULT 'pt-PT' AFTER timezone,
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'EUR' AFTER locale,
  ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(8) NOT NULL DEFAULT '€' AFTER currency;

CREATE TABLE IF NOT EXISTS tenant_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  works_saturday BOOLEAN NOT NULL DEFAULT TRUE,
  works_sunday BOOLEAN NOT NULL DEFAULT FALSE,
  opening_time TIME NOT NULL DEFAULT '08:00:00',
  closing_time TIME NOT NULL DEFAULT '18:00:00',
  lunch_start_time TIME NULL DEFAULT '12:00:00',
  lunch_end_time TIME NULL DEFAULT '14:00:00',
  default_service_duration_minutes INT UNSIGNED NOT NULL DEFAULT 60,
  appointment_interval_minutes INT UNSIGNED NOT NULL DEFAULT 30,
  work_order_prefix VARCHAR(10) NOT NULL DEFAULT 'OS',
  work_order_next_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
  work_order_number_padding TINYINT UNSIGNED NOT NULL DEFAULT 6,
  automatic_work_order_number BOOLEAN NOT NULL DEFAULT TRUE,
  default_tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  default_employee_commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  default_parts_margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  default_services_margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  allow_negative_stock BOOLEAN NOT NULL DEFAULT FALSE,
  require_customer_approval BOOLEAN NOT NULL DEFAULT TRUE,
  require_vehicle_photos BOOLEAN NOT NULL DEFAULT FALSE,
  require_checklist BOOLEAN NOT NULL DEFAULT TRUE,
  document_header_text TEXT NULL,
  document_footer_text TEXT NULL,
  document_terms TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_settings_tenant (tenant_id),
  CONSTRAINT fk_tenant_settings_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_business_hours (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  opening_time TIME NULL,
  lunch_start_time TIME NULL,
  lunch_end_time TIME NULL,
  closing_time TIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_business_hours_tenant_day (tenant_id, day_of_week),
  KEY idx_business_hours_tenant (tenant_id),
  CONSTRAINT chk_business_hours_day CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT fk_business_hours_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_integrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  integration_type ENUM('whatsapp', 'email', 'sms', 'payments', 'fiscal', 'parts_catalog', 'artificial_intelligence') NOT NULL,
  provider VARCHAR(80) NOT NULL DEFAULT 'default',
  status ENUM('inactive', 'active', 'error') NOT NULL DEFAULT 'inactive',
  config_json JSON NULL,
  last_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_integrations_type_provider (tenant_id, integration_type, provider),
  KEY idx_tenant_integrations_type (tenant_id, integration_type),
  CONSTRAINT fk_tenant_integrations_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
