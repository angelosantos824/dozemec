const pool = require("../config/database");

const settingsColumns = {
  worksSaturday: "works_saturday",
  worksSunday: "works_sunday",
  openingTime: "opening_time",
  closingTime: "closing_time",
  lunchStartTime: "lunch_start_time",
  lunchEndTime: "lunch_end_time",
  defaultServiceDurationMinutes: "default_service_duration_minutes",
  appointmentIntervalMinutes: "appointment_interval_minutes",
  workOrderPrefix: "work_order_prefix",
  workOrderNextNumber: "work_order_next_number",
  workOrderNumberPadding: "work_order_number_padding",
  automaticWorkOrderNumber: "automatic_work_order_number",
  defaultTaxPercentage: "default_tax_percentage",
  defaultEmployeeCommissionPercentage: "default_employee_commission_percentage",
  defaultPartsMarginPercentage: "default_parts_margin_percentage",
  defaultServicesMarginPercentage: "default_services_margin_percentage",
  allowNegativeStock: "allow_negative_stock",
  requireCustomerApproval: "require_customer_approval",
  requireVehiclePhotos: "require_vehicle_photos",
  requireChecklist: "require_checklist",
  documentHeaderText: "document_header_text",
  documentFooterText: "document_footer_text",
  documentTerms: "document_terms"
};

function bool(value) {
  return Boolean(value);
}

function trimTime(value) {
  return value ? String(value).slice(0, 5) : null;
}

function mapSettings(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    worksSaturday: bool(row.works_saturday),
    worksSunday: bool(row.works_sunday),
    openingTime: trimTime(row.opening_time),
    closingTime: trimTime(row.closing_time),
    lunchStartTime: trimTime(row.lunch_start_time),
    lunchEndTime: trimTime(row.lunch_end_time),
    defaultServiceDurationMinutes: row.default_service_duration_minutes,
    appointmentIntervalMinutes: row.appointment_interval_minutes,
    workOrderPrefix: row.work_order_prefix,
    workOrderNextNumber: row.work_order_next_number,
    workOrderNumberPadding: row.work_order_number_padding,
    automaticWorkOrderNumber: bool(row.automatic_work_order_number),
    defaultTaxPercentage: Number(row.default_tax_percentage),
    defaultEmployeeCommissionPercentage: Number(row.default_employee_commission_percentage),
    defaultPartsMarginPercentage: Number(row.default_parts_margin_percentage),
    defaultServicesMarginPercentage: Number(row.default_services_margin_percentage),
    allowNegativeStock: bool(row.allow_negative_stock),
    requireCustomerApproval: bool(row.require_customer_approval),
    requireVehiclePhotos: bool(row.require_vehicle_photos),
    requireChecklist: bool(row.require_checklist),
    documentHeaderText: row.document_header_text,
    documentFooterText: row.document_footer_text,
    documentTerms: row.document_terms
  };
}

function mapBusinessHour(row) {
  return {
    id: row.id,
    dayOfWeek: row.day_of_week,
    isOpen: bool(row.is_open),
    openingTime: trimTime(row.opening_time),
    lunchStartTime: trimTime(row.lunch_start_time),
    lunchEndTime: trimTime(row.lunch_end_time),
    closingTime: trimTime(row.closing_time)
  };
}

function mapIntegration(row) {
  return {
    id: row.id,
    integrationType: row.integration_type,
    provider: row.provider,
    status: row.status,
    config: row.config_json || null,
    lastSyncAt: row.last_sync_at
  };
}

async function ensureSettings(tenantId, connection) {
  await connection.execute(
    `INSERT INTO tenant_settings (tenant_id)
    VALUES (?)
    ON DUPLICATE KEY UPDATE tenant_id = VALUES(tenant_id)`,
    [tenantId]
  );
}

async function findSettings(tenantId, connection = pool) {
  const [rows] = await connection.execute("SELECT * FROM tenant_settings WHERE tenant_id = ? LIMIT 1", [
    tenantId
  ]);
  return mapSettings(rows[0]);
}

async function updateSettings(tenantId, data, connection) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;

  const assignments = entries.map(([field]) => `${settingsColumns[field]} = ?`).join(", ");
  const values = entries.map(([, value]) => value);
  await connection.execute(`UPDATE tenant_settings SET ${assignments} WHERE tenant_id = ?`, [
    ...values,
    tenantId
  ]);
}

async function findBusinessHours(tenantId, connection = pool) {
  const [rows] = await connection.execute(
    "SELECT * FROM tenant_business_hours WHERE tenant_id = ? ORDER BY day_of_week",
    [tenantId]
  );
  return rows.map(mapBusinessHour);
}

async function upsertBusinessHour(tenantId, day, connection) {
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
      Boolean(day.isOpen),
      day.openingTime || null,
      day.lunchStartTime || null,
      day.lunchEndTime || null,
      day.closingTime || null
    ]
  );
}

async function findIntegrations(tenantId, connection = pool) {
  const [rows] = await connection.execute(
    "SELECT * FROM tenant_integrations WHERE tenant_id = ? ORDER BY integration_type, provider",
    [tenantId]
  );
  return rows.map(mapIntegration);
}

async function findIntegration(tenantId, integrationType, provider, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT * FROM tenant_integrations
    WHERE tenant_id = ? AND integration_type = ? AND provider = ?
    LIMIT 1`,
    [tenantId, integrationType, provider]
  );
  return rows[0] ? mapIntegration(rows[0]) : null;
}

async function upsertIntegration(tenantId, integrationType, provider, status, connection) {
  await connection.execute(
    `INSERT INTO tenant_integrations (tenant_id, integration_type, provider, status, config_json)
    VALUES (?, ?, ?, ?, JSON_OBJECT())
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      config_json = COALESCE(config_json, JSON_OBJECT())`,
    [tenantId, integrationType, provider, status]
  );
}

module.exports = {
  ensureSettings,
  findSettings,
  updateSettings,
  findBusinessHours,
  upsertBusinessHour,
  findIntegrations,
  findIntegration,
  upsertIntegration
};
