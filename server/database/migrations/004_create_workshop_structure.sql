CREATE TABLE IF NOT EXISTS workshop_areas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  description TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workshop_areas_tenant_id (tenant_id, id),
  UNIQUE KEY uq_workshop_areas_tenant_code (tenant_id, code),
  KEY idx_workshop_areas_tenant_status_order (tenant_id, status, display_order),
  CONSTRAINT fk_workshop_areas_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workshop_bays (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  area_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  description TEXT NULL,
  bay_type ENUM('general', 'lift', 'alignment', 'balancing', 'diagnostics', 'electrical', 'washing', 'parking', 'other') NOT NULL DEFAULT 'general',
  capacity INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  operational_status ENUM('available', 'reserved', 'occupied', 'maintenance', 'unavailable') NOT NULL DEFAULT 'available',
  display_order INT NOT NULL DEFAULT 0,
  color VARCHAR(20) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workshop_bays_tenant_id (tenant_id, id),
  UNIQUE KEY uq_workshop_bays_tenant_code (tenant_id, code),
  KEY idx_workshop_bays_area (tenant_id, area_id),
  KEY idx_workshop_bays_status (tenant_id, status),
  KEY idx_workshop_bays_operational_status (tenant_id, operational_status),
  CONSTRAINT fk_workshop_bays_area FOREIGN KEY (tenant_id, area_id) REFERENCES workshop_areas (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  description TEXT NULL,
  requires_maintenance BOOLEAN NOT NULL DEFAULT TRUE,
  default_maintenance_interval_days INT UNSIGNED NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  display_order INT NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_equipment_types_tenant_id (tenant_id, id),
  UNIQUE KEY uq_equipment_types_tenant_code (tenant_id, code),
  KEY idx_equipment_types_tenant_status (tenant_id, status),
  CONSTRAINT fk_equipment_types_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workshop_equipment (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  equipment_type_id BIGINT UNSIGNED NOT NULL,
  bay_id BIGINT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  brand VARCHAR(120) NULL,
  model VARCHAR(120) NULL,
  serial_number VARCHAR(120) NULL,
  asset_number VARCHAR(120) NULL,
  purchase_date DATE NULL,
  purchase_value DECIMAL(12,2) NULL,
  warranty_end_date DATE NULL,
  last_maintenance_date DATE NULL,
  next_maintenance_date DATE NULL,
  maintenance_interval_days INT UNSIGNED NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  operational_status ENUM('available', 'in_use', 'maintenance', 'unavailable', 'retired') NOT NULL DEFAULT 'available',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_equipment_tenant_id (tenant_id, id),
  UNIQUE KEY uq_equipment_tenant_code (tenant_id, code),
  UNIQUE KEY uq_equipment_tenant_asset (tenant_id, asset_number),
  UNIQUE KEY uq_equipment_tenant_serial (tenant_id, serial_number),
  KEY idx_equipment_type (tenant_id, equipment_type_id),
  KEY idx_equipment_bay (tenant_id, bay_id),
  KEY idx_equipment_status (tenant_id, status),
  KEY idx_equipment_operational_status (tenant_id, operational_status),
  KEY idx_equipment_next_maintenance (tenant_id, next_maintenance_date),
  CONSTRAINT fk_equipment_type FOREIGN KEY (tenant_id, equipment_type_id) REFERENCES equipment_types (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_bay FOREIGN KEY (tenant_id, bay_id) REFERENCES workshop_bays (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment_maintenance_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  equipment_id BIGINT UNSIGNED NOT NULL,
  maintenance_type ENUM('preventive', 'corrective', 'inspection', 'calibration', 'other') NOT NULL DEFAULT 'preventive',
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  description TEXT NULL,
  service_provider VARCHAR(150) NULL,
  technician_name VARCHAR(150) NULL,
  scheduled_date DATE NOT NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  cost DECIMAL(12,2) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_maintenance_tenant_id (tenant_id, id),
  KEY idx_maintenance_equipment (tenant_id, equipment_id),
  KEY idx_maintenance_status (tenant_id, status),
  KEY idx_maintenance_type (tenant_id, maintenance_type),
  KEY idx_maintenance_scheduled (tenant_id, scheduled_date),
  CONSTRAINT fk_maintenance_equipment FOREIGN KEY (tenant_id, equipment_id) REFERENCES workshop_equipment (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bay_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  bay_id BIGINT UNSIGNED NOT NULL,
  previous_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NOT NULL,
  reason VARCHAR(255) NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bay_status_history (tenant_id, bay_id, created_at),
  CONSTRAINT fk_bay_status_history_bay FOREIGN KEY (tenant_id, bay_id) REFERENCES workshop_bays (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  equipment_id BIGINT UNSIGNED NOT NULL,
  previous_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NOT NULL,
  reason VARCHAR(255) NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_equipment_status_history (tenant_id, equipment_id, created_at),
  CONSTRAINT fk_equipment_status_history_equipment FOREIGN KEY (tenant_id, equipment_id) REFERENCES workshop_equipment (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
