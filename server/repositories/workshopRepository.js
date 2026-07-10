const pool = require("../config/database");

const tables = {
  areas: "workshop_areas",
  bays: "workshop_bays",
  equipmentTypes: "equipment_types",
  equipment: "workshop_equipment",
  maintenance: "equipment_maintenance_records"
};

function toSnake(key) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

async function list(table, tenantId, filters, pagination, extraWhere = []) {
  const where = [`${table}.tenant_id = ?`, `${table}.deleted_at IS NULL`, ...extraWhere];
  const values = [tenantId];
  if (filters.search) {
    where.push(`(${table}.name LIKE ? OR ${table}.code LIKE ?)`);
    values.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.status) {
    where.push(`${table}.status = ?`);
    values.push(filters.status);
  }
  for (const [queryKey, column] of Object.entries({
    areaId: "area_id",
    bayType: "bay_type",
    operationalStatus: "operational_status",
    equipmentTypeId: "equipment_type_id",
    bayId: "bay_id",
    equipmentId: "equipment_id",
    maintenanceStatus: "status",
    maintenanceType: "maintenance_type"
  })) {
    if (filters[queryKey]) {
      where.push(`${table}.${column} = ?`);
      values.push(filters[queryKey]);
    }
  }
  if (filters.maintenanceDue === "true") where.push(`${table}.next_maintenance_date <= CURRENT_DATE`);

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM ${table} WHERE ${whereSql}`, values);
  const [rows] = await pool.execute(
    `SELECT ${table}.* FROM ${table}
    WHERE ${whereSql}
    ORDER BY ${pagination.sortColumn} ${pagination.sortOrder}
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    values
  );
  return { items: rows, total: countRows[0].total };
}

async function findById(table, tenantId, id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT * FROM ${table} WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1`,
    [tenantId, id]
  );
  return rows[0] || null;
}

async function findByCode(table, tenantId, code, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT * FROM ${table} WHERE tenant_id = ? AND code = ? AND deleted_at IS NULL LIMIT 1`,
    [tenantId, code]
  );
  return rows[0] || null;
}

async function create(table, tenantId, data, userId, connection) {
  const fields = Object.keys(data).filter((key) => data[key] !== undefined);
  const columns = ["tenant_id", ...fields.map(toSnake), "created_by"];
  const values = [tenantId, ...fields.map((key) => data[key]), userId];
  const placeholders = columns.map(() => "?").join(", ");
  const [result] = await connection.execute(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    values
  );
  return result.insertId;
}

async function update(table, tenantId, id, data, userId, connection) {
  const fields = Object.keys(data).filter((key) => data[key] !== undefined);
  if (!fields.length) return;
  const assignments = fields.map((key) => `${toSnake(key)} = ?`);
  const values = fields.map((key) => data[key]);
  assignments.push("updated_by = ?");
  values.push(userId);
  await connection.execute(
    `UPDATE ${table} SET ${assignments.join(", ")} WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`,
    [...values, tenantId, id]
  );
}

async function softDelete(table, tenantId, id, userId, connection) {
  await connection.execute(
    `UPDATE ${table} SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`,
    [userId, tenantId, id]
  );
}

async function count(table, tenantId, column, value, connection = pool, extra = "") {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total FROM ${table} WHERE tenant_id = ? AND ${column} = ? AND deleted_at IS NULL ${extra}`,
    [tenantId, value]
  );
  return rows[0].total;
}

module.exports = { tables, list, findById, findByCode, create, update, softDelete, count };
