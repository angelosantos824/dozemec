const pool = require("../config/database");

function map(row) {
  return row && {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    code: row.code,
    description: row.description,
    isSystemRole: Boolean(row.is_system_role),
    isAdmin: Boolean(row.is_admin),
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function list(tenantId, filters, pagination) {
  const where = ["tenant_id = ?", "deleted_at IS NULL"];
  const values = [tenantId];
  if (filters.search) {
    where.push("(name LIKE ? OR code LIKE ?)");
    values.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.status) {
    where.push("status = ?");
    values.push(filters.status);
  }
  const whereSql = where.join(" AND ");
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM roles WHERE ${whereSql}`, values);
  const [rows] = await pool.execute(
    `SELECT * FROM roles WHERE ${whereSql}
    ORDER BY ${pagination.sortColumn} ${pagination.sortOrder}
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    values
  );
  return { items: rows.map(map), total: countRows[0].total };
}

async function findById(tenantId, id, connection = pool) {
  const [rows] = await connection.execute(
    "SELECT * FROM roles WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1",
    [tenantId, id]
  );
  return map(rows[0]);
}

async function findWithPermissions(tenantId, id, connection = pool) {
  const role = await findById(tenantId, id, connection);
  if (!role) return null;
  const [rows] = await connection.execute(
    `SELECT permissions.id, permissions.code, permissions.name, permissions.module
    FROM role_permissions
    INNER JOIN permissions ON permissions.id = role_permissions.permission_id
    WHERE role_permissions.role_id = ?
    ORDER BY permissions.module, permissions.code`,
    [id]
  );
  role.permissions = rows;
  return role;
}

async function existsCode(tenantId, code, ignoreId, connection = pool) {
  if (!code) return false;
  const values = [tenantId, code];
  let sql = "SELECT id FROM roles WHERE tenant_id = ? AND code = ? AND deleted_at IS NULL";
  if (ignoreId) {
    sql += " AND id <> ?";
    values.push(ignoreId);
  }
  const [rows] = await connection.execute(sql, values);
  return rows.length > 0;
}

async function create(tenantId, data, userId, connection) {
  const [result] = await connection.execute(
    `INSERT INTO roles (tenant_id, name, code, description, is_admin, display_order, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, data.name, data.code, data.description || null, false, data.displayOrder || 0, data.status || "active", userId]
  );
  return result.insertId;
}

async function update(tenantId, id, data, userId, connection) {
  const mapFields = { name: "name", code: "code", description: "description", displayOrder: "display_order", status: "status" };
  const entries = Object.entries(data).filter(([key, value]) => value !== undefined && key !== "permissionIds");
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${mapFields[key]} = ?`);
  const values = entries.map(([, value]) => value);
  assignments.push("updated_by = ?");
  values.push(userId);
  await connection.execute(
    `UPDATE roles SET ${assignments.join(", ")} WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`,
    [...values, tenantId, id]
  );
}

async function replacePermissions(roleId, permissionIds, connection) {
  await connection.execute("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);
  for (const permissionId of permissionIds) {
    await connection.execute(
      `INSERT INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)`,
      [roleId, permissionId]
    );
  }
}

async function activeUsersCount(tenantId, id, connection = pool) {
  const [rows] = await connection.execute(
    "SELECT COUNT(*) AS total FROM users WHERE tenant_id = ? AND role_id = ? AND status = 'active' AND deleted_at IS NULL",
    [tenantId, id]
  );
  return rows[0].total;
}

async function softDelete(tenantId, id, userId, connection) {
  await connection.execute(
    "UPDATE roles SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE tenant_id = ? AND id = ?",
    [userId, tenantId, id]
  );
}

module.exports = {
  list,
  findById,
  findWithPermissions,
  existsCode,
  create,
  update,
  replacePermissions,
  activeUsersCount,
  softDelete
};
