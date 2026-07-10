const bcrypt = require("bcryptjs");
const pool = require("../server/config/database");
const { permissions } = require("../server/database/seeds/initialData");

function permissionName(code) {
  return code
    .split(".")
    .map((part) => part.replace("_", " "))
    .join(" ");
}

async function upsertTenant(connection) {
  await connection.execute(
    `INSERT INTO tenants (name, trade_name, slug, status)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      trade_name = VALUES(trade_name),
      status = VALUES(status)`,
    ["DOZEMEC Oficina Demonstração", "DOZEMEC Demo", "dozemec-demo", "active"]
  );

  const [rows] = await connection.execute("SELECT id FROM tenants WHERE slug = ?", ["dozemec-demo"]);
  return rows[0].id;
}

async function upsertSector(connection, tenantId) {
  await connection.execute(
    `INSERT INTO sectors (tenant_id, name, status)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [tenantId, "Administração", "active"]
  );

  const [rows] = await connection.execute(
    "SELECT id FROM sectors WHERE tenant_id = ? AND name = ?",
    [tenantId, "Administração"]
  );
  return rows[0].id;
}

async function upsertRole(connection, tenantId) {
  await connection.execute(
    `INSERT INTO roles (tenant_id, name, description, is_system_role, status)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      is_system_role = VALUES(is_system_role),
      status = VALUES(status)`,
    [tenantId, "Admin", "Perfil administrador do tenant", true, "active"]
  );

  const [rows] = await connection.execute("SELECT id FROM roles WHERE tenant_id = ? AND name = ?", [
    tenantId,
    "Admin"
  ]);
  return rows[0].id;
}

async function upsertPermissions(connection) {
  for (const code of permissions) {
    const module = code.split(".")[0];
    await connection.execute(
      `INSERT INTO permissions (code, name, description, module)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        module = VALUES(module)`,
      [code, permissionName(code), `Permissao ${code}`, module]
    );
  }
}

async function syncRolePermissions(connection, roleId) {
  const [permissionRows] = await connection.execute("SELECT id FROM permissions");

  for (const permission of permissionRows) {
    await connection.execute(
      `INSERT INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)`,
      [roleId, permission.id]
    );
  }
}

async function upsertAdminUser(connection, tenantId, sectorId, roleId) {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  await connection.execute(
    `INSERT INTO users (tenant_id, sector_id, role_id, name, email, password_hash, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      sector_id = VALUES(sector_id),
      role_id = VALUES(role_id),
      name = VALUES(name),
      password_hash = VALUES(password_hash),
      status = VALUES(status)`,
    [
      tenantId,
      sectorId,
      roleId,
      "Administrador DOZEMEC",
      "admin@dozemec.com",
      passwordHash,
      "active"
    ]
  );

  const [rows] = await connection.execute(
    "SELECT id FROM users WHERE tenant_id = ? AND email = ?",
    [tenantId, "admin@dozemec.com"]
  );

  return rows[0].id;
}

async function createAuditLog(connection, tenantId, userId) {
  await connection.execute(
    `INSERT INTO audit_logs (tenant_id, user_id, action, entity, entity_id, new_data, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      userId,
      "seed.initial_data",
      "users",
      userId,
      JSON.stringify({ email: "admin@dozemec.com", role: "Admin" }),
      "127.0.0.1"
    ]
  );
}

async function run() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const tenantId = await upsertTenant(connection);
    const sectorId = await upsertSector(connection, tenantId);
    const roleId = await upsertRole(connection, tenantId);
    await upsertPermissions(connection);
    await syncRolePermissions(connection, roleId);
    const userId = await upsertAdminUser(connection, tenantId, sectorId, roleId);
    await createAuditLog(connection, tenantId, userId);

    await connection.commit();
    console.log("Seed inicial executado com sucesso.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Erro ao executar seed:", error.message);
  process.exit(1);
});
