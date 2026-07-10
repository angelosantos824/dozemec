const pool = require("../config/database");
const AppError = require("../utils/AppError");
const auditRepository = require("../repositories/auditRepository");
const employeeRepository = require("../repositories/employeeRepository");
const employeeService = require("./employeeService");
const validators = require("../validators/employeeValidators");

async function list({ tenantId, employeeId }) {
  await employeeService.requireEmployee(tenantId, employeeId);
  return { items: employeeService.protectDocuments(await employeeRepository.listDocuments(tenantId, employeeId), true) };
}

async function create({ tenantId, employeeId, userId, ipAddress, data }) {
  validators.document(data);
  return persist({ tenantId, employeeId, userId, ipAddress, data, action: "employee.document.create" });
}

async function update({ tenantId, employeeId, documentId, userId, ipAddress, data }) {
  validators.document(data, true);
  return persist({ tenantId, employeeId, documentId, userId, ipAddress, data, action: "employee.document.update" });
}

async function remove({ tenantId, employeeId, documentId, userId, ipAddress }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await employeeService.requireEmployee(tenantId, employeeId, connection);
    const oldData = await requireDocument(tenantId, employeeId, documentId, connection);
    await employeeRepository.softDeleteDocument(tenantId, employeeId, documentId, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "employee.document.delete", entity: "employee_documents", entityId: documentId, oldData, newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id: documentId, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function persist({ tenantId, employeeId, documentId, userId, ipAddress, data, action }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await employeeService.requireEmployee(tenantId, employeeId, connection);
    const oldData = documentId ? await requireDocument(tenantId, employeeId, documentId, connection) : null;
    const id = documentId || await employeeRepository.createDocument(tenantId, employeeId, data, userId, connection);
    if (documentId) await employeeRepository.updateDocument(tenantId, employeeId, documentId, data, userId, connection);
    const newData = await requireDocument(tenantId, employeeId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: "employee_documents", entityId: id, oldData, newData, ipAddress });
    await connection.commit();
    return employeeService.protectDocuments([{
      id: newData.id,
      documentType: newData.document_type,
      documentNumber: newData.document_number,
      issueDate: newData.issue_date,
      expiryDate: newData.expiry_date,
      fileUrl: newData.file_url,
      notes: newData.notes,
      status: newData.status
    }], true)[0];
  } catch (error) {
    await connection.rollback();
    if (error && error.code === "ER_DUP_ENTRY") throw new AppError("Documento duplicado para este funcionario", 409);
    throw error;
  } finally {
    connection.release();
  }
}

async function requireDocument(tenantId, employeeId, documentId, connection) {
  const document = await employeeRepository.findDocument(tenantId, employeeId, documentId, connection);
  if (!document) throw new AppError("Documento nao encontrado", 404);
  return document;
}

module.exports = { list, create, update, remove };
