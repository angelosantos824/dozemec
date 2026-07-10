const pool = require("../config/database");

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    sectorId: row.sector_id,
    roleId: row.role_id,
    name: row.name,
    email: row.email,
    username: row.username,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    status: row.status,
    mustChangePassword: Boolean(row.must_change_password),
    failedLoginAttempts: row.failed_login_attempts,
    lockedUntil: row.locked_until,
    passwordChangedAt: row.password_changed_at,
    lastLoginAt: row.last_login_at,
    sector: row.sector_name,
    role: row.role_name,
    roleIsAdmin: Boolean(row.role_is_admin),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const publicSelect = `users.id, users.tenant_id, users.sector_id, users.role_id, users.name,
  users.email, users.username, users.phone, users.avatar_url, users.status,
  users.must_change_password, users.failed_login_attempts, users.locked_until,
  users.password_changed_at, users.last_login_at, users.created_at, users.updated_at,
  sectors.name AS sector_name, roles.name AS role_name, roles.is_admin AS role_is_admin`;

async function findActiveByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT
      ${publicSelect},
      users.password_hash,
      users.deleted_at,
      tenants.status AS tenant_status
    FROM users
    INNER JOIN tenants ON tenants.id = users.tenant_id
    LEFT JOIN sectors ON sectors.id = users.sector_id AND sectors.tenant_id = users.tenant_id
    INNER JOIN roles ON roles.id = users.role_id AND roles.tenant_id = users.tenant_id
    WHERE users.email = ?
    LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function updateLastLogin(userId, tenantId, connection = pool) {
  await connection.execute(
    `UPDATE users
    SET last_login_at = CURRENT_TIMESTAMP, failed_login_attempts = 0, locked_until = NULL
    WHERE id = ? AND tenant_id = ?`,
    [userId, tenantId]
  );
}

async function incrementFailedLogin(userId, tenantId, attempts, lockedUntil, connection) {
  await connection.execute(
    "UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ? AND tenant_id = ?",
    [attempts, lockedUntil, userId, tenantId]
  );
}

async function list(tenantId, filters, pagination) {
  const where = ["users.tenant_id = ?", "users.deleted_at IS NULL"];
  const values = [tenantId];

  if (filters.search) {
    where.push("(users.name LIKE ? OR users.email LIKE ? OR users.username LIKE ?)");
    const term = `%${filters.search}%`;
    values.push(term, term, term);
  }
  if (filters.status) {
    where.push("users.status = ?");
    values.push(filters.status);
  }
  if (filters.sectorId) {
    where.push("users.sector_id = ?");
    values.push(filters.sectorId);
  }
  if (filters.roleId) {
    where.push("users.role_id = ?");
    values.push(filters.roleId);
  }

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users WHERE ${whereSql}`,
    values
  );
  const [rows] = await pool.execute(
    `SELECT ${publicSelect}
    FROM users
    LEFT JOIN sectors ON sectors.id = users.sector_id AND sectors.tenant_id = users.tenant_id
    INNER JOIN roles ON roles.id = users.role_id AND roles.tenant_id = users.tenant_id
    WHERE ${whereSql}
    ORDER BY ${pagination.sortColumn} ${pagination.sortOrder}
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    values
  );
  return { items: rows.map(mapUser), total: countRows[0].total };
}

async function findById(tenantId, id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${publicSelect}
    FROM users
    LEFT JOIN sectors ON sectors.id = users.sector_id AND sectors.tenant_id = users.tenant_id
    INNER JOIN roles ON roles.id = users.role_id AND roles.tenant_id = users.tenant_id
    WHERE users.tenant_id = ? AND users.id = ? AND users.deleted_at IS NULL
    LIMIT 1`,
    [tenantId, id]
  );
  return mapUser(rows[0]);
}

async function existsByEmail(tenantId, email, ignoreId, connection = pool) {
  const values = [tenantId, email];
  let sql = "SELECT id FROM users WHERE tenant_id = ? AND email = ? AND deleted_at IS NULL";
  if (ignoreId) {
    sql += " AND id <> ?";
    values.push(ignoreId);
  }
  const [rows] = await connection.execute(sql, values);
  return rows.length > 0;
}

async function existsByUsername(tenantId, username, ignoreId, connection = pool) {
  if (!username) return false;
  const values = [tenantId, username];
  let sql = "SELECT id FROM users WHERE tenant_id = ? AND username = ? AND deleted_at IS NULL";
  if (ignoreId) {
    sql += " AND id <> ?";
    values.push(ignoreId);
  }
  const [rows] = await connection.execute(sql, values);
  return rows.length > 0;
}

async function create(tenantId, data, passwordHash, createdBy, connection) {
  const [result] = await connection.execute(
    `INSERT INTO users
      (tenant_id, sector_id, role_id, name, email, username, phone, avatar_url,
       password_hash, must_change_password, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      data.sectorId || null,
      data.roleId,
      data.name,
      data.email,
      data.username || null,
      data.phone || null,
      data.avatarUrl || null,
      passwordHash,
      true,
      data.status || "active",
      createdBy
    ]
  );
  return result.insertId;
}

async function update(tenantId, id, data, updatedBy, connection) {
  const map = {
    name: "name",
    email: "email",
    username: "username",
    phone: "phone",
    avatarUrl: "avatar_url",
    sectorId: "sector_id",
    roleId: "role_id",
    status: "status"
  };
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;
  const assignments = entries.map(([key]) => `${map[key]} = ?`);
  const values = entries.map(([, value]) => value || null);
  assignments.push("updated_by = ?");
  values.push(updatedBy);
  await connection.execute(
    `UPDATE users SET ${assignments.join(", ")} WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`,
    [...values, tenantId, id]
  );
}

async function setStatus(tenantId, id, status, updatedBy, connection) {
  await connection.execute(
    `UPDATE users
    SET status = ?, updated_by = ?, failed_login_attempts = 0, locked_until = NULL
    WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`,
    [status, updatedBy, tenantId, id]
  );
}

async function resetPassword(tenantId, id, passwordHash, resetBy, connection) {
  await connection.execute(
    `UPDATE users
    SET password_hash = ?, must_change_password = TRUE, password_changed_at = CURRENT_TIMESTAMP,
      failed_login_attempts = 0, locked_until = NULL, updated_by = ?
    WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`,
    [passwordHash, resetBy, tenantId, id]
  );
  await connection.execute(
    `INSERT INTO user_password_resets
      (tenant_id, user_id, reset_by_user_id, temporary_password_generated, must_change_password)
    VALUES (?, ?, ?, TRUE, TRUE)`,
    [tenantId, id, resetBy]
  );
}

async function softDelete(tenantId, id, updatedBy, connection) {
  await connection.execute(
    `UPDATE users
    SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`,
    [updatedBy, tenantId, id]
  );
}

async function countActiveAdmins(tenantId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total
    FROM users
    INNER JOIN roles ON roles.id = users.role_id AND roles.tenant_id = users.tenant_id
    WHERE users.tenant_id = ?
      AND users.status = 'active'
      AND users.deleted_at IS NULL
      AND roles.is_admin = TRUE
      AND roles.deleted_at IS NULL`,
    [tenantId]
  );
  return rows[0].total;
}

module.exports = {
  findActiveByEmail,
  updateLastLogin,
  incrementFailedLogin,
  list,
  findById,
  existsByEmail,
  existsByUsername,
  create,
  update,
  setStatus,
  resetPassword,
  softDelete,
  countActiveAdmins
};
