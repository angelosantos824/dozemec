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
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress || null
    ]
  );
}

module.exports = { create };
