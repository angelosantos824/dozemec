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

async function listGrouped() {
  const [rows] = await pool.execute(
    "SELECT id, code, name, description, module FROM permissions ORDER BY module, code"
  );
  const groups = new Map();
  for (const permission of rows) {
    if (!groups.has(permission.module)) groups.set(permission.module, []);
    groups.get(permission.module).push({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      description: permission.description
    });
  }
  return Array.from(groups.entries()).map(([module, permissions]) => ({ module, permissions }));
}

async function idsExist(permissionIds, connection = pool) {
  if (!permissionIds.length) return true;
  const placeholders = permissionIds.map(() => "?").join(",");
  const [rows] = await connection.execute(
    `SELECT id FROM permissions WHERE id IN (${placeholders})`,
    permissionIds
  );
  return rows.length === permissionIds.length;
}

async function listCodesByRole(roleId, tenantId) {
  const [rows] = await pool.execute(
    `SELECT permissions.code
    FROM roles
    INNER JOIN role_permissions ON role_permissions.role_id = roles.id
    INNER JOIN permissions ON permissions.id = role_permissions.permission_id
    WHERE roles.id = ? AND roles.tenant_id = ? AND roles.deleted_at IS NULL
    ORDER BY permissions.code`,
    [roleId, tenantId]
  );
  return rows.map((row) => row.code);
}

module.exports = {
  roleHasPermission,
  listGrouped,
  idsExist,
  listCodesByRole
};
