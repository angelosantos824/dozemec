ALTER TABLE users
  MODIFY status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active';

ALTER TABLE sectors
  MODIFY status ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

ALTER TABLE roles
  MODIFY status ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(80) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL AFTER username,
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE AFTER password_hash,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0 AFTER must_change_password,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL AFTER failed_login_attempts,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL AFTER locked_until,
  ADD COLUMN IF NOT EXISTS created_by BIGINT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN IF NOT EXISTS updated_by BIGINT UNSIGNED NULL AFTER created_by,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER updated_by;

ALTER TABLE sectors
  ADD COLUMN IF NOT EXISTS code VARCHAR(80) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0 AFTER description,
  ADD COLUMN IF NOT EXISTS created_by BIGINT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN IF NOT EXISTS updated_by BIGINT UNSIGNED NULL AFTER created_by,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER updated_by;

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS code VARCHAR(80) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE AFTER is_system_role,
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0 AFTER description,
  ADD COLUMN IF NOT EXISTS created_by BIGINT UNSIGNED NULL AFTER updated_at,
  ADD COLUMN IF NOT EXISTS updated_by BIGINT UNSIGNED NULL AFTER created_by,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER updated_by;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_tenant_username ON users (tenant_id, username);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sectors_tenant_code ON sectors (tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_tenant_code ON roles (tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (tenant_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_sectors_deleted_at ON sectors (tenant_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_roles_deleted_at ON roles (tenant_id, deleted_at);

CREATE TABLE IF NOT EXISTS user_login_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  email_attempted VARCHAR(150) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason VARCHAR(180) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_history_tenant_created (tenant_id, created_at),
  KEY idx_login_history_user_created (user_id, created_at),
  CONSTRAINT fk_login_history_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_login_history_user
    FOREIGN KEY (tenant_id, user_id) REFERENCES users (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_password_resets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  reset_by_user_id BIGINT UNSIGNED NOT NULL,
  temporary_password_generated BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_password_resets_tenant_user (tenant_id, user_id),
  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (tenant_id, user_id) REFERENCES users (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_password_resets_admin
    FOREIGN KEY (tenant_id, reset_by_user_id) REFERENCES users (tenant_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
