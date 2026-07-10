const pool = require("../config/database");

async function findActiveByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT
      users.id,
      users.tenant_id,
      users.sector_id,
      users.role_id,
      users.name,
      users.email,
      users.password_hash,
      users.status,
      sectors.name AS sector_name,
      roles.name AS role_name,
      tenants.status AS tenant_status
    FROM users
    INNER JOIN tenants ON tenants.id = users.tenant_id
    LEFT JOIN sectors
      ON sectors.id = users.sector_id
      AND sectors.tenant_id = users.tenant_id
    INNER JOIN roles
      ON roles.id = users.role_id
      AND roles.tenant_id = users.tenant_id
    WHERE users.email = ?
    LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function updateLastLogin(userId, tenantId) {
  await pool.execute(
    "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?",
    [userId, tenantId]
  );
}

module.exports = {
  findActiveByEmail,
  updateLastLogin
};
