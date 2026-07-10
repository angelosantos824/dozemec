const pool = require("../config/database");

function map(row) {
  return row && {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    code: row.code,
    description: row.description,
    defaultCommissionPercentage: row.default_commission_percentage,
    status: row.status,
    displayOrder: row.display_order,
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
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM job_positions WHERE ${whereSql}`, values);
  const [rows] = await pool.execute(
    `SELECT * FROM job_positions WHERE ${whereSql}
    ORDER BY ${pagination.sortColumn} ${pagination.sortOrder}
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    values
  );
  return { items: rows.map(map), total: countRows[0].total };
}

async function findById(tenantId, id, connection = pool) {
  const [rows] = await connection.execute("SELECT * FROM job_positions WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1", [tenantId, id]);
  return map(rows[0]);
}

async function findByCode(tenantId, code, connection = pool) {
  const [rows] = await connection.execute("SELECT * FROM job_positions WHERE tenant_id = ? AND code = ? AND deleted_at IS NULL LIMIT 1", [tenantId, code]);
  return map(rows[0]);
}

async function create(tenantId, data, userId, connection) {
  const [result] = await connection.execute(
    `INSERT INTO job_positions
      (tenant_id, name, code, description, default_commission_percentage, status, display_order, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, data.name, data.code, data.description || null, data.defaultCommissionPercentage || 0, data.status || "active", data.displayOrder || 0, userId]
  );
  return result.insertId;
}

async function update(tenantId, id, data, userId, connection) {
  const fields = {
    name: "name",
    code: "code",
    description: "description",
    defaultCommissionPercentage: "default_commission_percentage",
    status: "status",
    displayOrder: "display_order"
  };
  const entries = Object.entries(data).filter(([key, value]) => fields[key] && value !== undefined);
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${fields[key]} = ?`);
  const values = entries.map(([, value]) => value || null);
  assignments.push("updated_by = ?");
  values.push(userId);
  await connection.execute(`UPDATE job_positions SET ${assignments.join(", ")} WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`, [...values, tenantId, id]);
}

async function softDelete(tenantId, id, userId, connection) {
  await connection.execute("UPDATE job_positions SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL", [userId, tenantId, id]);
}

async function countActiveEmployees(tenantId, id, connection = pool) {
  const [rows] = await connection.execute("SELECT COUNT(*) AS total FROM employees WHERE tenant_id = ? AND job_position_id = ? AND status = 'active' AND deleted_at IS NULL", [tenantId, id]);
  return rows[0].total;
}

module.exports = { list, findById, findByCode, create, update, softDelete, countActiveEmployees };
