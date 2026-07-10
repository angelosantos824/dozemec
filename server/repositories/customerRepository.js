const pool = require("../config/database");

const customerFields = {
  customerType: "customer_type",
  customerCode: "customer_code",
  fullName: "full_name",
  preferredName: "preferred_name",
  legalName: "legal_name",
  tradeName: "trade_name",
  taxNumber: "tax_number",
  identityDocument: "identity_document",
  stateRegistration: "state_registration",
  municipalRegistration: "municipal_registration",
  birthDate: "birth_date",
  gender: "gender",
  email: "email",
  phone: "phone",
  secondaryPhone: "secondary_phone",
  whatsapp: "whatsapp",
  website: "website",
  preferredContactMethod: "preferred_contact_method",
  language: "language",
  notes: "notes",
  creditLimit: "credit_limit",
  paymentTermsDays: "payment_terms_days",
  isBlocked: "is_blocked",
  blockReason: "block_reason",
  status: "status"
};

function toCamel(row) {
  if (!row) return null;
  const item = {};
  Object.entries(row).forEach(([key, value]) => {
    item[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  });
  if ("isBlocked" in item) item.isBlocked = Boolean(item.isBlocked);
  if ("isPrimary" in item) item.isPrimary = Boolean(item.isPrimary);
  if ("isBilling" in item) item.isBilling = Boolean(item.isBilling);
  if ("isServiceLocation" in item) item.isServiceLocation = Boolean(item.isServiceLocation);
  if ("receivesNotifications" in item) item.receivesNotifications = Boolean(item.receivesNotifications);
  if ("granted" in item) item.granted = Boolean(item.granted);
  if ("isConfidential" in item) item.isConfidential = Boolean(item.isConfidential);
  if ("allowServiceReminders" in item) item.allowServiceReminders = Boolean(item.allowServiceReminders);
  if ("allowPromotions" in item) item.allowPromotions = Boolean(item.allowPromotions);
  if ("allowSatisfactionSurveys" in item) item.allowSatisfactionSurveys = Boolean(item.allowSatisfactionSurveys);
  item.displayName = item.customerType === "company" ? (item.tradeName || item.legalName) : (item.preferredName || item.fullName);
  return item;
}

async function list(tenantId, filters, pagination) {
  const where = ["tenant_id = ?", "deleted_at IS NULL"];
  const values = [tenantId];
  if (filters.search) {
    where.push("(customer_code LIKE ? OR full_name LIKE ? OR legal_name LIKE ? OR trade_name LIKE ? OR email LIKE ?)");
    const term = `%${filters.search}%`;
    values.push(term, term, term, term, term);
  }
  for (const [key, column] of Object.entries({ status: "status", customerType: "customer_type", city: "city", state: "state", country: "country" })) {
    if (filters[key]) {
      if (["city", "state", "country"].includes(key)) {
        where.push(`EXISTS (SELECT 1 FROM customer_addresses ca WHERE ca.tenant_id = customers.tenant_id AND ca.customer_id = customers.id AND ca.${column} = ? AND ca.deleted_at IS NULL)`);
      } else {
        where.push(`${column} = ?`);
      }
      values.push(filters[key]);
    }
  }
  if (filters.hasWhatsapp === "true") where.push("whatsapp IS NOT NULL AND whatsapp <> ''");
  if (filters.hasEmail === "true") where.push("email IS NOT NULL AND email <> ''");
  if (filters.isBlocked === "true") where.push("is_blocked = TRUE");
  if (filters.isBlocked === "false") where.push("is_blocked = FALSE");
  if (filters.createdFrom) {
    where.push("created_at >= ?");
    values.push(filters.createdFrom);
  }
  if (filters.createdTo) {
    where.push("created_at <= ?");
    values.push(filters.createdTo);
  }
  const whereSql = where.join(" AND ");
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM customers WHERE ${whereSql}`, values);
  const [rows] = await pool.execute(
    `SELECT id, tenant_id, customer_type, customer_code, full_name, preferred_name, legal_name, trade_name,
      email, phone, whatsapp, is_blocked, status, created_at
    FROM customers
    WHERE ${whereSql}
    ORDER BY ${pagination.sortColumn} ${pagination.sortOrder}
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    values
  );
  return { items: rows.map(toCamel), total: countRows[0].total };
}

async function findById(tenantId, id, connection = pool) {
  const [rows] = await connection.execute("SELECT * FROM customers WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1", [tenantId, id]);
  return toCamel(rows[0]);
}

async function existsValue(tenantId, column, value, ignoreId, connection = pool) {
  if (!value) return false;
  const values = [tenantId, value];
  let sql = `SELECT id FROM customers WHERE tenant_id = ? AND ${column} = ? AND deleted_at IS NULL`;
  if (ignoreId) {
    sql += " AND id <> ?";
    values.push(ignoreId);
  }
  const [rows] = await connection.execute(sql, values);
  return rows.length > 0;
}

async function create(tenantId, data, userId, connection) {
  const keys = Object.keys(customerFields).filter((key) => data[key] !== undefined);
  const columns = ["tenant_id", ...keys.map((key) => customerFields[key]), "created_by"];
  const values = [tenantId, ...keys.map((key) => data[key] === undefined ? null : data[key]), userId];
  const [result] = await connection.execute(`INSERT INTO customers (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`, values);
  return result.insertId;
}

async function update(tenantId, id, data, userId, connection) {
  const entries = Object.entries(data).filter(([key, value]) => customerFields[key] && value !== undefined);
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${customerFields[key]} = ?`);
  const values = entries.map(([, value]) => value);
  assignments.push("updated_by = ?");
  values.push(userId);
  await connection.execute(`UPDATE customers SET ${assignments.join(", ")} WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`, [...values, tenantId, id]);
}

async function softDelete(tenantId, id, userId, connection) {
  await connection.execute("UPDATE customers SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL", [userId, tenantId, id]);
}

async function createDefaultPreferences(tenantId, customerId, data, connection) {
  await connection.execute(
    `INSERT INTO customer_preferences (tenant_id, customer_id, preferred_contact_method, language)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE customer_id = VALUES(customer_id)`,
    [tenantId, customerId, data.preferredContactMethod || "none", data.language || "pt-PT"]
  );
}

async function listChild(table, tenantId, customerId, order = "created_at DESC", connection = pool) {
  const [rows] = await connection.execute(`SELECT * FROM ${table} WHERE tenant_id = ? AND customer_id = ? AND deleted_at IS NULL ORDER BY ${order}`, [tenantId, customerId]);
  return rows.map(toCamel);
}

async function findChild(table, tenantId, customerId, id, connection = pool) {
  const [rows] = await connection.execute(`SELECT * FROM ${table} WHERE tenant_id = ? AND customer_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1`, [tenantId, customerId, id]);
  return toCamel(rows[0]);
}

async function insertChild(table, tenantId, customerId, data, fields, userId, connection) {
  const keys = Object.keys(fields).filter((key) => data[key] !== undefined);
  const columns = ["tenant_id", "customer_id", ...keys.map((key) => fields[key]), "created_by"];
  const values = [tenantId, customerId, ...keys.map((key) => data[key]), userId];
  const [result] = await connection.execute(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`, values);
  return result.insertId;
}

async function updateChild(table, tenantId, customerId, id, data, fields, userId, connection) {
  const entries = Object.entries(data).filter(([key, value]) => fields[key] && value !== undefined);
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${fields[key]} = ?`);
  const values = entries.map(([, value]) => value);
  if (table !== "customer_notes" && table !== "customer_relationships") {
    assignments.push("updated_by = ?");
    values.push(userId);
  }
  await connection.execute(`UPDATE ${table} SET ${assignments.join(", ")} WHERE tenant_id = ? AND customer_id = ? AND id = ? AND deleted_at IS NULL`, [...values, tenantId, customerId, id]);
}

async function softDeleteChild(table, tenantId, customerId, id, userId, connection) {
  const setUser = table === "customer_relationships" || table === "customer_notes" ? "" : ", updated_by = ?";
  const values = table === "customer_relationships" || table === "customer_notes" ? [tenantId, customerId, id] : [userId, tenantId, customerId, id];
  await connection.execute(`UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP${setUser} WHERE tenant_id = ? AND customer_id = ? AND id = ? AND deleted_at IS NULL`, values);
}

async function clearPrimary(table, tenantId, customerId, connection) {
  await connection.execute(`UPDATE ${table} SET is_primary = FALSE WHERE tenant_id = ? AND customer_id = ? AND deleted_at IS NULL`, [tenantId, customerId]);
}

async function getPreferences(tenantId, customerId, connection = pool) {
  const [rows] = await connection.execute("SELECT * FROM customer_preferences WHERE tenant_id = ? AND customer_id = ? LIMIT 1", [tenantId, customerId]);
  return toCamel(rows[0]);
}

async function upsertPreferences(tenantId, customerId, data, connection) {
  await connection.execute(
    `INSERT INTO customer_preferences
      (tenant_id, customer_id, preferred_contact_method, preferred_contact_time, language, allow_service_reminders, allow_promotions, allow_satisfaction_surveys, invoice_delivery_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE preferred_contact_method = VALUES(preferred_contact_method), preferred_contact_time = VALUES(preferred_contact_time),
      language = VALUES(language), allow_service_reminders = VALUES(allow_service_reminders), allow_promotions = VALUES(allow_promotions),
      allow_satisfaction_surveys = VALUES(allow_satisfaction_surveys), invoice_delivery_method = VALUES(invoice_delivery_method)`,
    [tenantId, customerId, data.preferredContactMethod || "none", data.preferredContactTime || null, data.language || "pt-PT", data.allowServiceReminders !== false, Boolean(data.allowPromotions), data.allowSatisfactionSurveys !== false, data.invoiceDeliveryMethod || "email"]
  );
}

async function addConsent(tenantId, customerId, consentType, data, userId, connection) {
  const granted = Boolean(data.granted);
  const [result] = await connection.execute(
    `INSERT INTO customer_consents (tenant_id, customer_id, consent_type, granted, source, granted_at, revoked_at, notes, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, customerId, consentType, granted, data.source || "manual", granted ? new Date() : null, granted ? null : new Date(), data.notes || null, userId, userId]
  );
  return result.insertId;
}

async function listConsents(tenantId, customerId, connection = pool) {
  const [rows] = await connection.execute("SELECT * FROM customer_consents WHERE tenant_id = ? AND customer_id = ? ORDER BY created_at DESC", [tenantId, customerId]);
  return rows.map(toCamel);
}

async function addStatusHistory(tenantId, customerId, previousStatus, newStatus, previousBlocked, newBlocked, reason, userId, connection) {
  await connection.execute(
    `INSERT INTO customer_status_history (tenant_id, customer_id, previous_status, new_status, previous_blocked, new_blocked, reason, changed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, customerId, previousStatus || null, newStatus || null, previousBlocked, newBlocked, reason || null, userId]
  );
}

async function addChangeHistory(tenantId, customerId, changeType, summary, changedFields, userId, connection) {
  await connection.execute(
    `INSERT INTO customer_change_history (tenant_id, customer_id, change_type, summary, changed_fields_json, changed_by)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [tenantId, customerId, changeType, summary || null, changedFields ? JSON.stringify(changedFields) : null, userId]
  );
}

async function listHistory(tenantId, customerId, connection = pool) {
  const [statusRows] = await connection.execute("SELECT 'status' AS type, previous_status AS previousStatus, new_status AS newStatus, previous_blocked AS previousBlocked, new_blocked AS newBlocked, reason, changed_by AS changedBy, created_at AS createdAt FROM customer_status_history WHERE tenant_id = ? AND customer_id = ?", [tenantId, customerId]);
  const [changeRows] = await connection.execute("SELECT 'change' AS type, change_type AS changeType, summary, changed_by AS changedBy, created_at AS createdAt FROM customer_change_history WHERE tenant_id = ? AND customer_id = ?", [tenantId, customerId]);
  const [consentRows] = await connection.execute("SELECT 'consent' AS type, consent_type AS consentType, granted, source, created_by AS changedBy, created_at AS createdAt FROM customer_consents WHERE tenant_id = ? AND customer_id = ?", [tenantId, customerId]);
  return [...statusRows, ...changeRows, ...consentRows].map(toCamel).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function summaryCounts(tenantId, customerId, connection = pool) {
  const [[contacts], [addresses], [documents], [consents], [relationships]] = await Promise.all([
    connection.execute("SELECT COUNT(*) total FROM customer_contacts WHERE tenant_id = ? AND customer_id = ? AND deleted_at IS NULL", [tenantId, customerId]),
    connection.execute("SELECT COUNT(*) total FROM customer_addresses WHERE tenant_id = ? AND customer_id = ? AND deleted_at IS NULL", [tenantId, customerId]),
    connection.execute("SELECT COUNT(*) total, SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 1 ELSE 0 END) expiringSoon FROM customer_documents WHERE tenant_id = ? AND customer_id = ? AND deleted_at IS NULL", [tenantId, customerId]),
    connection.execute("SELECT COUNT(*) total FROM customer_consents WHERE tenant_id = ? AND customer_id = ? AND granted = TRUE", [tenantId, customerId]),
    connection.execute("SELECT COUNT(*) total FROM customer_relationships WHERE tenant_id = ? AND customer_id = ? AND deleted_at IS NULL", [tenantId, customerId])
  ]);
  return { contacts: contacts[0].total, addresses: addresses[0].total, documents: documents[0].total, documentsExpiringSoon: documents[0].expiringSoon || 0, activeConsents: consents[0].total, relationships: relationships[0].total };
}

module.exports = {
  customerFields,
  toCamel,
  list,
  findById,
  existsValue,
  create,
  update,
  softDelete,
  createDefaultPreferences,
  listChild,
  findChild,
  insertChild,
  updateChild,
  softDeleteChild,
  clearPrimary,
  getPreferences,
  upsertPreferences,
  addConsent,
  listConsents,
  addStatusHistory,
  addChangeHistory,
  listHistory,
  summaryCounts
};
