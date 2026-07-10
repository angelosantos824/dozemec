const pool = require("../config/database");

const employeeFields = {
  userId: "user_id",
  sectorId: "sector_id",
  jobPositionId: "job_position_id",
  employeeNumber: "employee_number",
  fullName: "full_name",
  preferredName: "preferred_name",
  taxNumber: "tax_number",
  identityDocument: "identity_document",
  socialSecurityNumber: "social_security_number",
  birthDate: "birth_date",
  gender: "gender",
  maritalStatus: "marital_status",
  nationality: "nationality",
  email: "email",
  phone: "phone",
  secondaryPhone: "secondary_phone",
  whatsapp: "whatsapp",
  postalCode: "postal_code",
  address: "address",
  addressNumber: "address_number",
  addressComplement: "address_complement",
  neighborhood: "neighborhood",
  city: "city",
  state: "state",
  country: "country",
  photoUrl: "photo_url",
  hireDate: "hire_date",
  terminationDate: "termination_date",
  employmentType: "employment_type",
  contractStatus: "contract_status",
  baseSalary: "base_salary",
  hourlyRate: "hourly_rate",
  commissionPercentage: "commission_percentage",
  notes: "notes",
  emergencyContactName: "emergency_contact_name",
  emergencyContactRelationship: "emergency_contact_relationship",
  emergencyContactPhone: "emergency_contact_phone",
  status: "status"
};

function mapEmployee(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    sectorId: row.sector_id,
    jobPositionId: row.job_position_id,
    employeeNumber: row.employee_number,
    fullName: row.full_name,
    preferredName: row.preferred_name,
    taxNumber: row.tax_number,
    identityDocument: row.identity_document,
    socialSecurityNumber: row.social_security_number,
    birthDate: row.birth_date,
    gender: row.gender,
    maritalStatus: row.marital_status,
    nationality: row.nationality,
    email: row.email,
    phone: row.phone,
    secondaryPhone: row.secondary_phone,
    whatsapp: row.whatsapp,
    postalCode: row.postal_code,
    address: row.address,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    country: row.country,
    photoUrl: row.photo_url,
    hireDate: row.hire_date,
    terminationDate: row.termination_date,
    employmentType: row.employment_type,
    contractStatus: row.contract_status,
    baseSalary: row.base_salary,
    hourlyRate: row.hourly_rate,
    commissionPercentage: row.commission_percentage,
    notes: row.notes,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactRelationship: row.emergency_contact_relationship,
    emergencyContactPhone: row.emergency_contact_phone,
    status: row.status,
    sectorName: row.sector_name,
    jobPositionName: row.job_position_name,
    userName: row.user_name,
    userEmail: row.user_email,
    userStatus: row.user_status,
    hasUser: Boolean(row.user_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSpecialty(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    isPrimary: Boolean(row.is_primary),
    experienceYears: row.experience_years,
    certificationNotes: row.certification_notes
  };
}

async function list(tenantId, filters, pagination) {
  const where = ["e.tenant_id = ?", "e.deleted_at IS NULL"];
  const values = [tenantId];
  if (filters.search) {
    where.push("(e.full_name LIKE ? OR e.employee_number LIKE ? OR e.email LIKE ?)");
    values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  for (const [queryKey, column] of Object.entries({
    status: "e.status",
    sectorId: "e.sector_id",
    jobPositionId: "e.job_position_id",
    contractStatus: "e.contract_status",
    employmentType: "e.employment_type"
  })) {
    if (filters[queryKey]) {
      where.push(`${column} = ?`);
      values.push(filters[queryKey]);
    }
  }
  if (filters.hasUser === "true") where.push("e.user_id IS NOT NULL");
  if (filters.hasUser === "false") where.push("e.user_id IS NULL");
  if (filters.hiredFrom) {
    where.push("e.hire_date >= ?");
    values.push(filters.hiredFrom);
  }
  if (filters.hiredTo) {
    where.push("e.hire_date <= ?");
    values.push(filters.hiredTo);
  }
  if (filters.specialtyId) {
    where.push(`EXISTS (
      SELECT 1 FROM employee_specialty_assignments esa
      WHERE esa.tenant_id = e.tenant_id AND esa.employee_id = e.id AND esa.specialty_id = ?
    )`);
    values.push(filters.specialtyId);
  }
  const whereSql = where.join(" AND ");
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM employees e WHERE ${whereSql}`, values);
  const [rows] = await pool.execute(
    `SELECT e.id, e.tenant_id, e.user_id, e.sector_id, e.job_position_id, e.employee_number,
      e.full_name, e.preferred_name, e.email, e.phone, e.hire_date, e.employment_type,
      e.contract_status, e.commission_percentage, e.status, e.created_at, e.updated_at,
      s.name AS sector_name, jp.name AS job_position_name, u.name AS user_name, u.email AS user_email, u.status AS user_status
    FROM employees e
    LEFT JOIN sectors s ON s.id = e.sector_id AND s.tenant_id = e.tenant_id
    LEFT JOIN job_positions jp ON jp.id = e.job_position_id AND jp.tenant_id = e.tenant_id
    LEFT JOIN users u ON u.id = e.user_id AND u.tenant_id = e.tenant_id
    WHERE ${whereSql}
    ORDER BY ${pagination.sortColumn} ${pagination.sortOrder}
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    values
  );
  return { items: rows.map(mapEmployee), total: countRows[0].total };
}

async function findById(tenantId, id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT e.*, s.name AS sector_name, jp.name AS job_position_name,
      u.name AS user_name, u.email AS user_email, u.status AS user_status
    FROM employees e
    LEFT JOIN sectors s ON s.id = e.sector_id AND s.tenant_id = e.tenant_id
    LEFT JOIN job_positions jp ON jp.id = e.job_position_id AND jp.tenant_id = e.tenant_id
    LEFT JOIN users u ON u.id = e.user_id AND u.tenant_id = e.tenant_id
    WHERE e.tenant_id = ? AND e.id = ? AND e.deleted_at IS NULL
    LIMIT 1`,
    [tenantId, id]
  );
  return mapEmployee(rows[0]);
}

async function existsEmployeeNumber(tenantId, employeeNumber, ignoreId, connection = pool) {
  return existsValue(tenantId, "employee_number", employeeNumber, ignoreId, connection);
}

async function existsTaxNumber(tenantId, taxNumber, ignoreId, connection = pool) {
  if (!taxNumber) return false;
  return existsValue(tenantId, "tax_number", taxNumber, ignoreId, connection);
}

async function existsValue(tenantId, column, value, ignoreId, connection) {
  const values = [tenantId, value];
  let sql = `SELECT id FROM employees WHERE tenant_id = ? AND ${column} = ? AND deleted_at IS NULL`;
  if (ignoreId) {
    sql += " AND id <> ?";
    values.push(ignoreId);
  }
  const [rows] = await connection.execute(sql, values);
  return rows.length > 0;
}

async function userLinkedElsewhere(tenantId, userId, ignoreEmployeeId, connection = pool) {
  if (!userId) return false;
  const values = [tenantId, userId];
  let sql = "SELECT id FROM employees WHERE tenant_id = ? AND user_id = ? AND deleted_at IS NULL";
  if (ignoreEmployeeId) {
    sql += " AND id <> ?";
    values.push(ignoreEmployeeId);
  }
  const [rows] = await connection.execute(sql, values);
  return rows.length > 0;
}

async function create(tenantId, data, userId, connection) {
  const keys = Object.keys(employeeFields).filter((key) => data[key] !== undefined);
  const columns = ["tenant_id", ...keys.map((key) => employeeFields[key]), "created_by"];
  const values = [tenantId, ...keys.map((key) => data[key] || null), userId];
  const placeholders = columns.map(() => "?").join(", ");
  const [result] = await connection.execute(`INSERT INTO employees (${columns.join(", ")}) VALUES (${placeholders})`, values);
  return result.insertId;
}

async function update(tenantId, id, data, userId, connection) {
  const entries = Object.entries(data).filter(([key, value]) => employeeFields[key] && value !== undefined);
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${employeeFields[key]} = ?`);
  const values = entries.map(([, value]) => value || null);
  assignments.push("updated_by = ?");
  values.push(userId);
  await connection.execute(`UPDATE employees SET ${assignments.join(", ")} WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL`, [...values, tenantId, id]);
}

async function setStatusContract(tenantId, id, data, userId, connection) {
  await update(tenantId, id, data, userId, connection);
}

async function softDelete(tenantId, id, userId, connection) {
  await connection.execute("UPDATE employees SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL", [userId, tenantId, id]);
}

async function replaceSpecialties(tenantId, employeeId, specialtyIds, primarySpecialtyId, connection) {
  await connection.execute("DELETE FROM employee_specialty_assignments WHERE tenant_id = ? AND employee_id = ?", [tenantId, employeeId]);
  for (const specialtyId of specialtyIds || []) {
    await connection.execute(
      `INSERT INTO employee_specialty_assignments (tenant_id, employee_id, specialty_id, is_primary)
      VALUES (?, ?, ?, ?)`,
      [tenantId, employeeId, specialtyId, Number(specialtyId) === Number(primarySpecialtyId)]
    );
  }
}

async function listSpecialties(tenantId, employeeId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT es.id, es.name, es.code, esa.is_primary, esa.experience_years, esa.certification_notes
    FROM employee_specialty_assignments esa
    INNER JOIN employee_specialties es ON es.id = esa.specialty_id AND es.tenant_id = esa.tenant_id
    WHERE esa.tenant_id = ? AND esa.employee_id = ? AND es.deleted_at IS NULL
    ORDER BY esa.is_primary DESC, es.name`,
    [tenantId, employeeId]
  );
  return rows.map(mapSpecialty);
}

async function listSchedule(tenantId, employeeId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, day_of_week AS dayOfWeek, is_working_day AS isWorkingDay, TIME_FORMAT(start_time, '%H:%i') AS startTime,
      TIME_FORMAT(lunch_start_time, '%H:%i') AS lunchStartTime, TIME_FORMAT(lunch_end_time, '%H:%i') AS lunchEndTime,
      TIME_FORMAT(end_time, '%H:%i') AS endTime
    FROM employee_work_schedules
    WHERE tenant_id = ? AND employee_id = ?
    ORDER BY day_of_week`,
    [tenantId, employeeId]
  );
  return rows.map((row) => ({ ...row, isWorkingDay: Boolean(row.isWorkingDay) }));
}

async function upsertSchedule(tenantId, employeeId, days, connection) {
  for (const day of days) {
    await connection.execute(
      `INSERT INTO employee_work_schedules
        (tenant_id, employee_id, day_of_week, is_working_day, start_time, lunch_start_time, lunch_end_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE is_working_day = VALUES(is_working_day), start_time = VALUES(start_time),
        lunch_start_time = VALUES(lunch_start_time), lunch_end_time = VALUES(lunch_end_time), end_time = VALUES(end_time)`,
      [tenantId, employeeId, day.dayOfWeek, day.isWorkingDay !== false, day.startTime || null, day.lunchStartTime || null, day.lunchEndTime || null, day.endTime || null]
    );
  }
}

async function listDocuments(tenantId, employeeId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, document_type AS documentType, document_number AS documentNumber, issue_date AS issueDate,
      expiry_date AS expiryDate, file_url AS fileUrl, notes, status, created_at AS createdAt, updated_at AS updatedAt
    FROM employee_documents
    WHERE tenant_id = ? AND employee_id = ? AND deleted_at IS NULL
    ORDER BY expiry_date IS NULL, expiry_date, document_type`,
    [tenantId, employeeId]
  );
  return rows;
}

async function findDocument(tenantId, employeeId, documentId, connection = pool) {
  const [rows] = await connection.execute("SELECT * FROM employee_documents WHERE tenant_id = ? AND employee_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1", [tenantId, employeeId, documentId]);
  return rows[0] || null;
}

async function createDocument(tenantId, employeeId, data, userId, connection) {
  const [result] = await connection.execute(
    `INSERT INTO employee_documents
      (tenant_id, employee_id, document_type, document_number, issue_date, expiry_date, file_url, notes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, employeeId, data.documentType, data.documentNumber, data.issueDate || null, data.expiryDate || null, data.fileUrl || null, data.notes || null, data.status || "pending", userId]
  );
  return result.insertId;
}

async function updateDocument(tenantId, employeeId, documentId, data, userId, connection) {
  const fields = { documentType: "document_type", documentNumber: "document_number", issueDate: "issue_date", expiryDate: "expiry_date", fileUrl: "file_url", notes: "notes", status: "status" };
  const entries = Object.entries(data).filter(([key, value]) => fields[key] && value !== undefined);
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${fields[key]} = ?`);
  const values = entries.map(([, value]) => value || null);
  assignments.push("updated_by = ?");
  values.push(userId);
  await connection.execute(`UPDATE employee_documents SET ${assignments.join(", ")} WHERE tenant_id = ? AND employee_id = ? AND id = ? AND deleted_at IS NULL`, [...values, tenantId, employeeId, documentId]);
}

async function softDeleteDocument(tenantId, employeeId, documentId, userId, connection) {
  await connection.execute("UPDATE employee_documents SET deleted_at = CURRENT_TIMESTAMP, updated_by = ?, status = 'cancelled' WHERE tenant_id = ? AND employee_id = ? AND id = ? AND deleted_at IS NULL", [userId, tenantId, employeeId, documentId]);
}

async function listNotes(tenantId, employeeId, includeConfidential, connection = pool) {
  const where = ["tenant_id = ?", "employee_id = ?", "deleted_at IS NULL"];
  const values = [tenantId, employeeId];
  if (!includeConfidential) where.push("is_confidential = FALSE");
  const [rows] = await connection.execute(
    `SELECT id, note_type AS noteType, content, is_confidential AS isConfidential, created_by AS createdBy,
      created_at AS createdAt, updated_at AS updatedAt
    FROM employee_notes
    WHERE ${where.join(" AND ")}
    ORDER BY created_at DESC`,
    values
  );
  return rows.map((row) => ({ ...row, isConfidential: Boolean(row.isConfidential) }));
}

async function findNote(tenantId, employeeId, noteId, connection = pool) {
  const [rows] = await connection.execute("SELECT * FROM employee_notes WHERE tenant_id = ? AND employee_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1", [tenantId, employeeId, noteId]);
  return rows[0] || null;
}

async function createNote(tenantId, employeeId, data, userId, connection) {
  const [result] = await connection.execute(
    "INSERT INTO employee_notes (tenant_id, employee_id, note_type, content, is_confidential, created_by) VALUES (?, ?, ?, ?, ?, ?)",
    [tenantId, employeeId, data.noteType || "general", data.content, Boolean(data.isConfidential), userId]
  );
  return result.insertId;
}

async function updateNote(tenantId, employeeId, noteId, data, connection) {
  const fields = { noteType: "note_type", content: "content", isConfidential: "is_confidential" };
  const entries = Object.entries(data).filter(([key, value]) => fields[key] && value !== undefined);
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${fields[key]} = ?`);
  const values = entries.map(([, value]) => value);
  await connection.execute(`UPDATE employee_notes SET ${assignments.join(", ")} WHERE tenant_id = ? AND employee_id = ? AND id = ? AND deleted_at IS NULL`, [...values, tenantId, employeeId, noteId]);
}

async function softDeleteNote(tenantId, employeeId, noteId, connection) {
  await connection.execute("UPDATE employee_notes SET deleted_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND employee_id = ? AND id = ? AND deleted_at IS NULL", [tenantId, employeeId, noteId]);
}

async function addStatusHistory(tenantId, employeeId, previousStatus, newStatus, previousContractStatus, newContractStatus, reason, userId, connection) {
  await connection.execute(
    `INSERT INTO employee_status_history
      (tenant_id, employee_id, previous_status, new_status, previous_contract_status, new_contract_status, reason, changed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, employeeId, previousStatus || null, newStatus || null, previousContractStatus || null, newContractStatus || null, reason || null, userId]
  );
}

async function addUserLinkHistory(tenantId, employeeId, previousUserId, newUserId, reason, userId, connection) {
  await connection.execute(
    `INSERT INTO employee_user_link_history (tenant_id, employee_id, previous_user_id, new_user_id, reason, changed_by)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [tenantId, employeeId, previousUserId || null, newUserId || null, reason || null, userId]
  );
}

async function listHistory(tenantId, employeeId, connection = pool) {
  const [statusRows] = await connection.execute(
    `SELECT 'status' AS type, previous_status AS previousStatus, new_status AS newStatus,
      previous_contract_status AS previousContractStatus, new_contract_status AS newContractStatus,
      reason, changed_by AS changedBy, created_at AS createdAt
    FROM employee_status_history WHERE tenant_id = ? AND employee_id = ?`,
    [tenantId, employeeId]
  );
  const [linkRows] = await connection.execute(
    `SELECT 'user_link' AS type, previous_user_id AS previousUserId, new_user_id AS newUserId,
      reason, changed_by AS changedBy, created_at AS createdAt
    FROM employee_user_link_history WHERE tenant_id = ? AND employee_id = ?`,
    [tenantId, employeeId]
  );
  const [auditRows] = await connection.execute(
    `SELECT 'audit' AS type, action, LEFT(CAST(new_data AS CHAR), 800) AS summary,
      user_id AS changedBy, created_at AS createdAt
    FROM audit_logs
    WHERE tenant_id = ? AND entity = 'employees' AND entity_id = ?`,
    [tenantId, employeeId]
  );
  return [...statusRows, ...linkRows, ...auditRows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function documentSummary(tenantId, employeeId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expiringSoon
    FROM employee_documents
    WHERE tenant_id = ? AND employee_id = ? AND deleted_at IS NULL`,
    [tenantId, employeeId]
  );
  return { total: rows[0].total || 0, expiringSoon: rows[0].expiringSoon || 0 };
}

module.exports = {
  list,
  findById,
  existsEmployeeNumber,
  existsTaxNumber,
  userLinkedElsewhere,
  create,
  update,
  setStatusContract,
  softDelete,
  replaceSpecialties,
  listSpecialties,
  listSchedule,
  upsertSchedule,
  listDocuments,
  findDocument,
  createDocument,
  updateDocument,
  softDeleteDocument,
  listNotes,
  findNote,
  createNote,
  updateNote,
  softDeleteNote,
  addStatusHistory,
  addUserLinkHistory,
  listHistory,
  documentSummary,
  mapEmployee
};
