const pool = require("../config/database");
const AppError = require("../utils/AppError");
const auditRepository = require("../repositories/auditRepository");
const employeeRepository = require("../repositories/employeeRepository");
const employeeService = require("./employeeService");
const validators = require("../validators/employeeValidators");

async function list({ tenantId, employeeId, requester }) {
  await employeeService.requireEmployee(tenantId, employeeId);
  const access = await employeeService.accessFor(requester);
  if (!access.notes) throw new AppError("Permissao insuficiente", 403);
  return { items: await employeeRepository.listNotes(tenantId, employeeId, access.confidentialNotes) };
}

async function create({ tenantId, employeeId, userId, requester, ipAddress, data }) {
  validators.note(data);
  const access = await employeeService.accessFor(requester);
  if (data.isConfidential && !access.confidentialNotes) throw new AppError("Permissao insuficiente para nota confidencial", 403);
  return persist({ tenantId, employeeId, userId, ipAddress, data, action: "employee.note.create" });
}

async function update({ tenantId, employeeId, noteId, userId, requester, ipAddress, data }) {
  validators.note(data, true);
  const access = await employeeService.accessFor(requester);
  if (data.isConfidential && !access.confidentialNotes) throw new AppError("Permissao insuficiente para nota confidencial", 403);
  return persist({ tenantId, employeeId, noteId, userId, ipAddress, data, action: "employee.note.update" });
}

async function remove({ tenantId, employeeId, noteId, userId, ipAddress }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await employeeService.requireEmployee(tenantId, employeeId, connection);
    const oldData = await requireNote(tenantId, employeeId, noteId, connection);
    await employeeRepository.softDeleteNote(tenantId, employeeId, noteId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "employee.note.delete", entity: "employee_notes", entityId: noteId, oldData: safeNoteAudit(oldData), newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id: noteId, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function persist({ tenantId, employeeId, noteId, userId, ipAddress, data, action }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await employeeService.requireEmployee(tenantId, employeeId, connection);
    const oldData = noteId ? await requireNote(tenantId, employeeId, noteId, connection) : null;
    const id = noteId || await employeeRepository.createNote(tenantId, employeeId, data, userId, connection);
    if (noteId) await employeeRepository.updateNote(tenantId, employeeId, noteId, data, connection);
    const newData = await requireNote(tenantId, employeeId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: "employee_notes", entityId: id, oldData: safeNoteAudit(oldData), newData: safeNoteAudit(newData), ipAddress });
    await connection.commit();
    return { id: newData.id, noteType: newData.note_type, content: newData.content, isConfidential: Boolean(newData.is_confidential) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function requireNote(tenantId, employeeId, noteId, connection) {
  const note = await employeeRepository.findNote(tenantId, employeeId, noteId, connection);
  if (!note) throw new AppError("Nota nao encontrada", 404);
  return note;
}

function safeNoteAudit(note) {
  if (!note) return null;
  return note.is_confidential ? { ...note, content: "[confidencial]" } : { ...note, contentLength: String(note.content || "").length, content: undefined };
}

module.exports = { list, create, update, remove };
