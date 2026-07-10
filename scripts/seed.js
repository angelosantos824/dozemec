const bcrypt = require("bcryptjs");
const pool = require("../server/config/database");
const { permissions } = require("../server/database/seeds/initialData");

const integrationTypes = [
  "whatsapp",
  "email",
  "sms",
  "payments",
  "fiscal",
  "parts_catalog",
  "artificial_intelligence"
];

function permissionName(code) {
  return code
    .split(".")
    .map((part) => part.replace("_", " "))
    .join(" ");
}

async function upsertTenant(connection) {
  await connection.execute(
    `INSERT INTO tenants (
      name, legal_name, trade_name, slug, country, timezone, locale, currency,
      currency_symbol, theme, primary_color, secondary_color, accent_color, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      legal_name = VALUES(legal_name),
      trade_name = VALUES(trade_name),
      country = VALUES(country),
      timezone = VALUES(timezone),
      locale = VALUES(locale),
      currency = VALUES(currency),
      currency_symbol = VALUES(currency_symbol),
      theme = VALUES(theme),
      primary_color = VALUES(primary_color),
      secondary_color = VALUES(secondary_color),
      accent_color = VALUES(accent_color),
      status = VALUES(status)`,
    [
      "DOZEMEC Oficina Demonstração",
      "DOZEMEC Oficina Demonstração",
      "DOZEMEC Demo",
      "dozemec-demo",
      "Portugal",
      "Europe/Lisbon",
      "pt-PT",
      "EUR",
      "€",
      "dark",
      "#7C3AED",
      "#111827",
      "#22D3EE",
      "active"
    ]
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

  const [rows] = await connection.execute("SELECT id FROM sectors WHERE tenant_id = ? AND name = ?", [
    tenantId,
    "Administração"
  ]);
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
    [tenantId, sectorId, roleId, "Administrador DOZEMEC", "admin@dozemec.com", passwordHash, "active"]
  );

  const [rows] = await connection.execute("SELECT id FROM users WHERE tenant_id = ? AND email = ?", [
    tenantId,
    "admin@dozemec.com"
  ]);
  return rows[0].id;
}

async function upsertTenantSettings(connection, tenantId) {
  await connection.execute(
    `INSERT INTO tenant_settings (
      tenant_id, works_saturday, works_sunday, opening_time, closing_time,
      lunch_start_time, lunch_end_time, default_service_duration_minutes,
      appointment_interval_minutes, work_order_prefix, work_order_next_number,
      work_order_number_padding, automatic_work_order_number, default_tax_percentage,
      default_employee_commission_percentage, default_parts_margin_percentage,
      default_services_margin_percentage, allow_negative_stock, require_customer_approval,
      require_vehicle_photos, require_checklist
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      works_saturday = VALUES(works_saturday),
      works_sunday = VALUES(works_sunday),
      opening_time = VALUES(opening_time),
      closing_time = VALUES(closing_time),
      lunch_start_time = VALUES(lunch_start_time),
      lunch_end_time = VALUES(lunch_end_time),
      default_service_duration_minutes = VALUES(default_service_duration_minutes),
      appointment_interval_minutes = VALUES(appointment_interval_minutes),
      work_order_prefix = VALUES(work_order_prefix),
      work_order_number_padding = VALUES(work_order_number_padding),
      automatic_work_order_number = VALUES(automatic_work_order_number),
      default_tax_percentage = VALUES(default_tax_percentage),
      default_employee_commission_percentage = VALUES(default_employee_commission_percentage),
      default_parts_margin_percentage = VALUES(default_parts_margin_percentage),
      default_services_margin_percentage = VALUES(default_services_margin_percentage),
      allow_negative_stock = VALUES(allow_negative_stock),
      require_customer_approval = VALUES(require_customer_approval),
      require_vehicle_photos = VALUES(require_vehicle_photos),
      require_checklist = VALUES(require_checklist)`,
    [
      tenantId,
      true,
      false,
      "08:00",
      "18:00",
      "12:00",
      "14:00",
      60,
      30,
      "OS",
      1,
      6,
      true,
      0,
      0,
      0,
      0,
      false,
      true,
      false,
      true
    ]
  );
}

async function upsertBusinessHours(connection, tenantId) {
  const days = [
    { dayOfWeek: 0, isOpen: false, openingTime: null, lunchStartTime: null, lunchEndTime: null, closingTime: null },
    { dayOfWeek: 1, isOpen: true, openingTime: "08:00", lunchStartTime: "12:00", lunchEndTime: "14:00", closingTime: "18:00" },
    { dayOfWeek: 2, isOpen: true, openingTime: "08:00", lunchStartTime: "12:00", lunchEndTime: "14:00", closingTime: "18:00" },
    { dayOfWeek: 3, isOpen: true, openingTime: "08:00", lunchStartTime: "12:00", lunchEndTime: "14:00", closingTime: "18:00" },
    { dayOfWeek: 4, isOpen: true, openingTime: "08:00", lunchStartTime: "12:00", lunchEndTime: "14:00", closingTime: "18:00" },
    { dayOfWeek: 5, isOpen: true, openingTime: "08:00", lunchStartTime: "12:00", lunchEndTime: "14:00", closingTime: "18:00" },
    { dayOfWeek: 6, isOpen: true, openingTime: "08:00", lunchStartTime: null, lunchEndTime: null, closingTime: "13:00" }
  ];

  for (const day of days) {
    await connection.execute(
      `INSERT INTO tenant_business_hours
        (tenant_id, day_of_week, is_open, opening_time, lunch_start_time, lunch_end_time, closing_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_open = VALUES(is_open),
        opening_time = VALUES(opening_time),
        lunch_start_time = VALUES(lunch_start_time),
        lunch_end_time = VALUES(lunch_end_time),
        closing_time = VALUES(closing_time)`,
      [
        tenantId,
        day.dayOfWeek,
        day.isOpen,
        day.openingTime,
        day.lunchStartTime,
        day.lunchEndTime,
        day.closingTime
      ]
    );
  }
}

async function upsertIntegrations(connection, tenantId) {
  for (const type of integrationTypes) {
    await connection.execute(
      `INSERT INTO tenant_integrations (tenant_id, integration_type, provider, status, config_json)
      VALUES (?, ?, ?, ?, JSON_OBJECT())
      ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [tenantId, type, "default", "inactive"]
    );
  }
}

async function createAuditLog(connection, tenantId, userId) {
  await connection.execute("DELETE FROM audit_logs WHERE tenant_id = ? AND action = ?", [
    tenantId,
    "seed.initial_data"
  ]);
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
    await upsertTenantSettings(connection, tenantId);
    await upsertBusinessHours(connection, tenantId);
    await upsertIntegrations(connection, tenantId);
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
