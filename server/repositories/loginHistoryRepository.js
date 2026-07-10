const pool = require("../config/database");

async function create(connection, { tenantId, userId, emailAttempted, success, failureReason, ipAddress, userAgent }) {
  await connection.execute(
    `INSERT INTO user_login_history
      (tenant_id, user_id, email_attempted, success, failure_reason, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      userId || null,
      emailAttempted,
      Boolean(success),
      failureReason || null,
      ipAddress || null,
      userAgent ? String(userAgent).slice(0, 255) : null
    ]
  );
}

async function listByUser(tenantId, userId, pagination) {
  const [countRows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM user_login_history WHERE tenant_id = ? AND user_id = ?",
    [tenantId, userId]
  );
  const [rows] = await pool.execute(
    `SELECT id, email_attempted AS emailAttempted, success, failure_reason AS failureReason,
      ip_address AS ipAddress, LEFT(user_agent, 120) AS userAgent, created_at AS createdAt
    FROM user_login_history
    WHERE tenant_id = ? AND user_id = ?
    ORDER BY created_at DESC
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    [tenantId, userId]
  );
  return { rows, total: countRows[0].total };
}

module.exports = { create, listByUser };
