const bcrypt = require("bcryptjs");
const pool = require("../server/config/database");
const { permissions } = require("../server/database/seeds/initialData");

const sectors = [
  ["Administração", "ADMINISTRACAO", 0],
  ["Recepção", "RECEPCAO", 10],
  ["Mecânica", "MECANICA", 20],
  ["Elétrica", "ELETRICA", 30],
  ["Alinhamento", "ALINHAMENTO", 40],
  ["Estoque", "ESTOQUE", 50],
  ["Financeiro", "FINANCEIRO", 60],
  ["Gerência", "GERENCIA", 70]
];

const rolePermissionCodes = {
  Admin: "all",
  Gerente: ["dashboard.read", "users.read", "sectors.read", "roles.read", "reports.read", "company.read", "company_settings.read", "audit_logs.read", "workshop_areas.read", "workshop_areas.create", "workshop_areas.update", "workshop_areas.delete", "workshop_bays.read", "workshop_bays.create", "workshop_bays.update", "workshop_bays.delete", "workshop_bays.change_status", "workshop_bays.view_history", "equipment_types.read", "equipment_types.create", "equipment_types.update", "equipment_types.delete", "equipment.read", "equipment.create", "equipment.update", "equipment.delete", "equipment.change_status", "equipment.view_history", "equipment_maintenance.read", "equipment_maintenance.create", "equipment_maintenance.update", "equipment_maintenance.delete", "equipment_maintenance.complete", "workshop_map.read"],
  Recepção: ["dashboard.read", "customers.read", "customers.create", "vehicles.read", "vehicles.create", "work_orders.read", "work_orders.create", "workshop_bays.read", "equipment.read", "workshop_map.read"],
  Mecânico: ["dashboard.read", "work_orders.read", "services.read", "equipment.read", "equipment.change_status", "equipment.view_history", "workshop_bays.read", "workshop_bays.change_status", "equipment_maintenance.read", "equipment_maintenance.update", "workshop_map.read"],
  Estoque: ["dashboard.read", "inventory.read", "inventory.create", "inventory.update", "equipment.read"],
  Financeiro: ["dashboard.read", "financial.read", "financial.create", "financial.update", "reports.read"],
  Consulta: ["dashboard.read", "customers.read", "vehicles.read", "work_orders.read", "reports.read", "workshop_areas.read", "workshop_bays.read", "equipment_types.read", "equipment.read", "equipment_maintenance.read", "workshop_map.read"]
};

const roles = [
  ["Admin", "ADMIN", "Perfil administrador do tenant", true, true, 0],
  ["Gerente", "GERENTE", "Gestão operacional", false, true, 10],
  ["Recepção", "RECEPCAO", "Atendimento e recepção", false, false, 20],
  ["Mecânico", "MECANICO", "Acesso técnico de oficina", false, false, 30],
  ["Estoque", "ESTOQUE", "Gestão básica de estoque", false, false, 40],
  ["Financeiro", "FINANCEIRO", "Acesso financeiro básico", false, false, 50],
  ["Consulta", "CONSULTA", "Acesso somente leitura", false, false, 60]
];

const integrationTypes = ["whatsapp", "email", "sms", "payments", "fiscal", "parts_catalog", "artificial_intelligence"];

const demoAreas = [
  ["Oficina principal", "MAIN_WORKSHOP", "Área principal de manutenção", 10],
  ["Alinhamento", "ALIGNMENT", "Área de alinhamento", 20],
  ["Balanceamento", "BALANCING", "Área de balanceamento", 30]
];

const demoEquipmentTypes = [
  ["Elevador automotivo", "AUTOMOTIVE_LIFT", 180, 10],
  ["Máquina de alinhamento", "ALIGNMENT_MACHINE", 180, 20],
  ["Máquina de balanceamento", "BALANCING_MACHINE", 180, 30],
  ["Scanner automotivo", "AUTOMOTIVE_SCANNER", 365, 40],
  ["Compressor", "COMPRESSOR", 180, 50],
  ["Prensa hidráulica", "HYDRAULIC_PRESS", 180, 60],
  ["Máquina de solda", "WELDING_MACHINE", 180, 70],
  ["Lavadora", "WASHER", 180, 80]
];

const demoBays = [
  ["Baia 01", "BAY_01", "MAIN_WORKSHOP", "lift", 10, "#7C3AED"],
  ["Baia 02", "BAY_02", "MAIN_WORKSHOP", "lift", 20, "#7C3AED"],
  ["Baia 03", "BAY_03", "MAIN_WORKSHOP", "lift", 30, "#7C3AED"],
  ["Baia 04", "BAY_04", "MAIN_WORKSHOP", "lift", 40, "#7C3AED"],
  ["Baia 05", "BAY_05", "MAIN_WORKSHOP", "lift", 50, "#7C3AED"],
  ["Alinhamento 01", "ALIGNMENT_01", "ALIGNMENT", "alignment", 60, "#22D3EE"],
  ["Alinhamento 02", "ALIGNMENT_02", "ALIGNMENT", "alignment", 70, "#22D3EE"],
  ["Balanceamento 01", "BALANCING_01", "BALANCING", "balancing", 80, "#34D399"]
];

const demoEquipment = [
  ["Elevador 01", "LIFT_01", "AUTOMOTIVE_LIFT", "BAY_01", "PAT-0001"],
  ["Elevador 02", "LIFT_02", "AUTOMOTIVE_LIFT", "BAY_02", "PAT-0002"],
  ["Elevador 03", "LIFT_03", "AUTOMOTIVE_LIFT", "BAY_03", "PAT-0003"],
  ["Elevador 04", "LIFT_04", "AUTOMOTIVE_LIFT", "BAY_04", "PAT-0004"],
  ["Elevador 05", "LIFT_05", "AUTOMOTIVE_LIFT", "BAY_05", "PAT-0005"],
  ["Alinhador 01", "ALIGNER_01", "ALIGNMENT_MACHINE", "ALIGNMENT_01", "PAT-0006"],
  ["Alinhador 02", "ALIGNER_02", "ALIGNMENT_MACHINE", "ALIGNMENT_02", "PAT-0007"],
  ["Balanceadora 01", "BALANCER_01", "BALANCING_MACHINE", "BALANCING_01", "PAT-0008"]
];

const employeePermissions = [
  "job_positions.create",
  "job_positions.read",
  "job_positions.update",
  "job_positions.delete",
  "employee_specialties.create",
  "employee_specialties.read",
  "employee_specialties.update",
  "employee_specialties.delete",
  "employees.create",
  "employees.read",
  "employees.update",
  "employees.delete",
  "employees.activate",
  "employees.deactivate",
  "employees.link_user",
  "employees.view_documents",
  "employees.manage_documents",
  "employees.view_history",
  "employee_schedules.read",
  "employee_schedules.update",
  "employee_notes.create",
  "employee_notes.read",
  "employee_notes.update",
  "employee_notes.delete"
];

const customerPermissions = [
  "customers.create",
  "customers.read",
  "customers.update",
  "customers.delete",
  "customers.activate",
  "customers.deactivate",
  "customers.block",
  "customers.unblock",
  "customers.view_documents",
  "customers.manage_documents",
  "customers.view_history",
  "customer_contacts.create",
  "customer_contacts.read",
  "customer_contacts.update",
  "customer_contacts.delete",
  "customer_addresses.create",
  "customer_addresses.read",
  "customer_addresses.update",
  "customer_addresses.delete",
  "customer_consents.read",
  "customer_consents.update",
  "customer_notes.create",
  "customer_notes.read",
  "customer_notes.update",
  "customer_notes.delete",
  "customer_relationships.create",
  "customer_relationships.read",
  "customer_relationships.delete"
];

const jobPositions = [
  ["Gerente de oficina", "WORKSHOP_MANAGER", "Gestao operacional da oficina", 0, 10],
  ["Rececionista", "RECEPTIONIST", "Atendimento e recepcao", 0, 20],
  ["Mecanico", "MECHANIC", "Profissional de mecanica geral", 5, 30],
  ["Eletricista automotivo", "AUTOMOTIVE_ELECTRICIAN", "Especialista em sistemas eletricos", 5, 40],
  ["Tecnico de alinhamento", "ALIGNMENT_TECHNICIAN", "Tecnico de alinhamento e geometria", 3, 50],
  ["Estoquista", "STOCK_KEEPER", "Responsavel por estoque", 0, 60],
  ["Auxiliar de oficina", "WORKSHOP_ASSISTANT", "Apoio operacional da oficina", 0, 70]
];

const employeeSpecialties = [
  ["Mecanica geral", "GENERAL_MECHANICS", "Manutencao mecanica geral", 10],
  ["Motores diesel", "DIESEL_ENGINES", "Manutencao de motores diesel", 20],
  ["Motores a gasolina", "GASOLINE_ENGINES", "Manutencao de motores a gasolina", 30],
  ["Freios", "BRAKES", "Sistemas de travagem", 40],
  ["Suspensao", "SUSPENSION", "Suspensao e direcao", 50],
  ["Eletrica automotiva", "AUTOMOTIVE_ELECTRICAL", "Sistemas eletricos automotivos", 60],
  ["Eletronica embarcada", "ONBOARD_ELECTRONICS", "Diagnostico eletronico", 70],
  ["Alinhamento", "ALIGNMENT", "Alinhamento de direcao", 80],
  ["Balanceamento", "BALANCING", "Balanceamento de rodas", 90],
  ["Diagnostico automotivo", "AUTOMOTIVE_DIAGNOSTICS", "Diagnostico tecnico", 100],
  ["Caminhoes", "TRUCKS", "Veiculos pesados", 110],
  ["Ar-condicionado", "AIR_CONDITIONING", "Climatizacao automotiva", 120]
];

function permissionName(code) {
  return code.split(".").map((part) => part.replace("_", " ")).join(" ");
}

async function upsertTenant(connection) {
  await connection.execute(
    `INSERT INTO tenants (
      name, legal_name, trade_name, slug, country, timezone, locale, currency,
      currency_symbol, theme, primary_color, secondary_color, accent_color, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), legal_name = VALUES(legal_name), trade_name = VALUES(trade_name),
      country = VALUES(country), timezone = VALUES(timezone), locale = VALUES(locale),
      currency = VALUES(currency), currency_symbol = VALUES(currency_symbol), theme = VALUES(theme),
      primary_color = VALUES(primary_color), secondary_color = VALUES(secondary_color),
      accent_color = VALUES(accent_color), status = VALUES(status)`,
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

async function upsertPermissions(connection) {
  for (const code of [...new Set(permissions)]) {
    const module = code.split(".")[0];
    await connection.execute(
      `INSERT INTO permissions (code, name, description, module)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), module = VALUES(module)`,
      [code, permissionName(code), `Permissao ${code}`, module]
    );
  }
}

async function upsertSectors(connection, tenantId) {
  for (const [name, code, displayOrder] of sectors) {
    await connection.execute(
      `INSERT INTO sectors (tenant_id, name, code, display_order, status)
      VALUES (?, ?, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name), code = VALUES(code), display_order = VALUES(display_order),
        status = 'active', deleted_at = NULL`,
      [tenantId, name, code, displayOrder]
    );
  }
  const [rows] = await connection.execute("SELECT id FROM sectors WHERE tenant_id = ? AND code = 'ADMINISTRACAO'", [tenantId]);
  return rows[0].id;
}

async function upsertRoles(connection, tenantId) {
  const roleIds = {};
  for (const [name, code, description, isSystemRole, isAdmin, displayOrder] of roles) {
    await connection.execute(
      `INSERT INTO roles (tenant_id, name, code, description, is_system_role, is_admin, display_order, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name), code = VALUES(code), description = VALUES(description), is_system_role = VALUES(is_system_role),
        is_admin = VALUES(is_admin), display_order = VALUES(display_order), status = 'active', deleted_at = NULL`,
      [tenantId, name, code, description, isSystemRole, isAdmin, displayOrder]
    );
    const [rows] = await connection.execute("SELECT id FROM roles WHERE tenant_id = ? AND code = ?", [tenantId, code]);
    roleIds[name] = rows[0].id;
  }
  return roleIds;
}

async function syncRolePermissions(connection, roleIds) {
  rolePermissionCodes.Gerente = [...new Set([...(rolePermissionCodes.Gerente || []), ...employeePermissions])];
  rolePermissionCodes.Gerente = [...new Set([...(rolePermissionCodes.Gerente || []), ...customerPermissions])];
  rolePermissionCodes["Recepção"] = [...new Set([...(rolePermissionCodes["Recepção"] || []), "employees.read", "job_positions.read", "employee_specialties.read"])];
  rolePermissionCodes["Recepção"] = [...new Set([...(rolePermissionCodes["Recepção"] || []), "customers.create", "customers.read", "customers.update", "customer_contacts.create", "customer_contacts.read", "customer_contacts.update", "customer_addresses.create", "customer_addresses.read", "customer_addresses.update", "customer_consents.read"])];
  rolePermissionCodes["Mecânico"] = [...new Set([...(rolePermissionCodes["Mecânico"] || []), "employees.read"])];
  rolePermissionCodes["Mecânico"] = [...new Set([...(rolePermissionCodes["Mecânico"] || []), "customers.read"])];
  rolePermissionCodes.Financeiro = [...new Set([...(rolePermissionCodes.Financeiro || []), "employees.read", "employees.view_financial_data"])];
  rolePermissionCodes.Financeiro = [...new Set([...(rolePermissionCodes.Financeiro || []), "customers.read", "customers.view_financial_data", "customer_contacts.read", "customer_addresses.read"])];
  rolePermissionCodes.Consulta = [...new Set([...(rolePermissionCodes.Consulta || []), "employees.read", "job_positions.read", "employee_specialties.read"])];
  rolePermissionCodes.Consulta = [...new Set([...(rolePermissionCodes.Consulta || []), "customers.read", "customer_contacts.read", "customer_addresses.read"])];

  const [permissionRows] = await connection.execute("SELECT id, code FROM permissions");
  const byCode = new Map(permissionRows.map((permission) => [permission.code, permission.id]));

  for (const [roleName, roleId] of Object.entries(roleIds)) {
    const codes = rolePermissionCodes[roleName] === "all" ? permissionRows.map((permission) => permission.code) : rolePermissionCodes[roleName] || [];
    for (const code of codes) {
      if (!byCode.has(code)) continue;
      await connection.execute(
        `INSERT INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)`,
        [roleId, byCode.get(code)]
      );
    }
  }
}

async function upsertAdminUser(connection, tenantId, sectorId, roleId) {
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await connection.execute(
    `INSERT INTO users
      (tenant_id, sector_id, role_id, name, email, username, password_hash, must_change_password, status, password_changed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, 'active', CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      sector_id = VALUES(sector_id), role_id = VALUES(role_id), name = VALUES(name),
      username = VALUES(username), status = 'active', deleted_at = NULL`,
    [tenantId, sectorId, roleId, "Administrador DOZEMEC", "admin@dozemec.com", "admin", passwordHash]
  );

  const [rows] = await connection.execute("SELECT id FROM users WHERE tenant_id = ? AND email = ?", [tenantId, "admin@dozemec.com"]);
  return rows[0].id;
}

async function upsertTenantSettings(connection, tenantId) {
  await connection.execute(
    `INSERT INTO tenant_settings (tenant_id)
    VALUES (?)
    ON DUPLICATE KEY UPDATE tenant_id = VALUES(tenant_id)`,
    [tenantId]
  );
}

async function upsertBusinessHours(connection, tenantId) {
  const days = [
    [0, false, null, null, null, null],
    [1, true, "08:00", "12:00", "14:00", "18:00"],
    [2, true, "08:00", "12:00", "14:00", "18:00"],
    [3, true, "08:00", "12:00", "14:00", "18:00"],
    [4, true, "08:00", "12:00", "14:00", "18:00"],
    [5, true, "08:00", "12:00", "14:00", "18:00"],
    [6, true, "08:00", null, null, "13:00"]
  ];
  for (const day of days) {
    await connection.execute(
      `INSERT INTO tenant_business_hours
        (tenant_id, day_of_week, is_open, opening_time, lunch_start_time, lunch_end_time, closing_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE is_open = VALUES(is_open), opening_time = VALUES(opening_time),
        lunch_start_time = VALUES(lunch_start_time), lunch_end_time = VALUES(lunch_end_time),
        closing_time = VALUES(closing_time)`,
      [tenantId, ...day]
    );
  }
}

async function upsertIntegrations(connection, tenantId) {
  for (const type of integrationTypes) {
    await connection.execute(
      `INSERT INTO tenant_integrations (tenant_id, integration_type, provider, status, config_json)
      VALUES (?, ?, 'default', 'inactive', JSON_OBJECT())
      ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [tenantId, type]
    );
  }
}

async function createAuditLog(connection, tenantId, userId) {
  await connection.execute("DELETE FROM audit_logs WHERE tenant_id = ? AND action = ?", [tenantId, "seed.initial_data"]);
  await connection.execute(
    `INSERT INTO audit_logs (tenant_id, user_id, action, entity, entity_id, new_data, ip_address)
    VALUES (?, ?, 'seed.initial_data', 'users', ?, ?, '127.0.0.1')`,
    [tenantId, userId, userId, JSON.stringify({ email: "admin@dozemec.com", role: "Admin" })]
  );
}

async function upsertWorkshopStructure(connection, tenantId) {
  const areaIds = {};
  for (const [name, code, description, displayOrder] of demoAreas) {
    await connection.execute(
      `INSERT INTO workshop_areas (tenant_id, name, code, description, display_order, status)
      VALUES (?, ?, ?, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), display_order = VALUES(display_order), status = 'active', deleted_at = NULL`,
      [tenantId, name, code, description, displayOrder]
    );
    const [rows] = await connection.execute("SELECT id FROM workshop_areas WHERE tenant_id = ? AND code = ?", [tenantId, code]);
    areaIds[code] = rows[0].id;
  }

  const typeIds = {};
  for (const [name, code, interval, displayOrder] of demoEquipmentTypes) {
    await connection.execute(
      `INSERT INTO equipment_types (tenant_id, name, code, requires_maintenance, default_maintenance_interval_days, display_order, status)
      VALUES (?, ?, ?, TRUE, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name), default_maintenance_interval_days = VALUES(default_maintenance_interval_days), display_order = VALUES(display_order), status = 'active', deleted_at = NULL`,
      [tenantId, name, code, interval, displayOrder]
    );
    const [rows] = await connection.execute("SELECT id FROM equipment_types WHERE tenant_id = ? AND code = ?", [tenantId, code]);
    typeIds[code] = rows[0].id;
  }

  const bayIds = {};
  for (const [name, code, areaCode, bayType, displayOrder, color] of demoBays) {
    await connection.execute(
      `INSERT INTO workshop_bays (tenant_id, area_id, name, code, bay_type, capacity, operational_status, display_order, color, status)
      VALUES (?, ?, ?, ?, ?, 1, 'available', ?, ?, 'active')
      ON DUPLICATE KEY UPDATE area_id = VALUES(area_id), name = VALUES(name), bay_type = VALUES(bay_type), display_order = VALUES(display_order), color = VALUES(color), status = 'active', deleted_at = NULL`,
      [tenantId, areaIds[areaCode], name, code, bayType, displayOrder, color]
    );
    const [rows] = await connection.execute("SELECT id FROM workshop_bays WHERE tenant_id = ? AND code = ?", [tenantId, code]);
    bayIds[code] = rows[0].id;
  }

  for (const [name, code, typeCode, bayCode, assetNumber] of demoEquipment) {
    await connection.execute(
      `INSERT INTO workshop_equipment (tenant_id, equipment_type_id, bay_id, name, code, asset_number, maintenance_interval_days, status, operational_status)
      VALUES (?, ?, ?, ?, ?, ?, 180, 'active', 'available')
      ON DUPLICATE KEY UPDATE equipment_type_id = VALUES(equipment_type_id), bay_id = VALUES(bay_id), name = VALUES(name), status = 'active', deleted_at = NULL`,
      [tenantId, typeIds[typeCode], bayIds[bayCode], name, code, assetNumber]
    );
  }
}

async function upsertEmployeeCatalogs(connection, tenantId) {
  for (const [name, code, description, commission, displayOrder] of jobPositions) {
    await connection.execute(
      `INSERT INTO job_positions
        (tenant_id, name, code, description, default_commission_percentage, display_order, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
        default_commission_percentage = VALUES(default_commission_percentage),
        display_order = VALUES(display_order), status = 'active', deleted_at = NULL`,
      [tenantId, name, code, description, commission, displayOrder]
    );
  }

  for (const [name, code, description, displayOrder] of employeeSpecialties) {
    await connection.execute(
      `INSERT INTO employee_specialties
        (tenant_id, name, code, description, display_order, status)
      VALUES (?, ?, ?, ?, ?, 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
        display_order = VALUES(display_order), status = 'active', deleted_at = NULL`,
      [tenantId, name, code, description, displayOrder]
    );
  }
}

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const tenantId = await upsertTenant(connection);
    await upsertPermissions(connection);
    const adminSectorId = await upsertSectors(connection, tenantId);
    const roleIds = await upsertRoles(connection, tenantId);
    await syncRolePermissions(connection, roleIds);
    const userId = await upsertAdminUser(connection, tenantId, adminSectorId, roleIds.Admin);
    await upsertTenantSettings(connection, tenantId);
    await upsertBusinessHours(connection, tenantId);
    await upsertIntegrations(connection, tenantId);
    await upsertWorkshopStructure(connection, tenantId);
    await upsertEmployeeCatalogs(connection, tenantId);
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
