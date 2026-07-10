const sensitiveKeys = ["password", "passwordHash", "password_hash", "token", "jwt", "jwtSecret", "JWT_SECRET"];

function sanitize(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitize);

  return Object.entries(value).reduce((clean, [key, item]) => {
    if (sensitiveKeys.includes(key)) return clean;
    clean[key] = sanitize(item);
    return clean;
  }, {});
}

async function create(connection, { tenantId, userId, action, entity, entityId, oldData, newData, ipAddress }) {
  await connection.execute(
    `INSERT INTO audit_logs
      (tenant_id, user_id, action, entity, entity_id, old_data, new_data, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      userId || null,
      action,
      entity,
      entityId || null,
      oldData ? JSON.stringify(sanitize(oldData)) : null,
      newData ? JSON.stringify(sanitize(newData)) : null,
      ipAddress || null
    ]
  );
}

async function list(connection, { tenantId, filters, pagination }) {
  const where = ["tenant_id = ?"];
  const values = [tenantId];

  if (filters.userId) {
    where.push("user_id = ?");
    values.push(filters.userId);
  }
  if (filters.action) {
    where.push("action = ?");
    values.push(filters.action);
  }
  if (filters.entity) {
    where.push("entity = ?");
    values.push(filters.entity);
  }
  if (filters.dateFrom) {
    where.push("created_at >= ?");
    values.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    where.push("created_at <= ?");
    values.push(filters.dateTo);
  }

  const whereSql = where.join(" AND ");
  const [countRows] = await connection.execute(
    `SELECT COUNT(*) AS total FROM audit_logs WHERE ${whereSql}`,
    values
  );
  const [rows] = await connection.execute(
    `SELECT id, user_id, action, entity, entity_id,
      LEFT(CAST(old_data AS CHAR), 2000) AS old_data,
      LEFT(CAST(new_data AS CHAR), 2000) AS new_data,
      ip_address, created_at
    FROM audit_logs
    WHERE ${whereSql}
    ORDER BY created_at DESC
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    values
  );

  return { rows, total: countRows[0].total };
}

module.exports = { create, list, sanitize };
