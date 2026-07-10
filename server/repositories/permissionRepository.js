const pool = require("../config/database");

async function roleHasPermission({ roleId, tenantId, permissionCode }) {
  const [rows] = await pool.execute(
    `SELECT permissions.id
    FROM roles
    INNER JOIN role_permissions ON role_permissions.role_id = roles.id
    INNER JOIN permissions ON permissions.id = role_permissions.permission_id
    WHERE roles.id = ?
      AND roles.tenant_id = ?
      AND roles.status = 'active'
      AND permissions.code = ?
    LIMIT 1`,
    [roleId, tenantId, permissionCode]
  );

  return rows.length > 0;
}

module.exports = {
  roleHasPermission
};
