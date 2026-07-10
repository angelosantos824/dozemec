const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const permissionRepository = require("../repositories/permissionRepository");
const employeeRepository = require("../repositories/employeeRepository");
const sectorRepository = require("../repositories/sectorRepository");
const jobPositionRepository = require("../repositories/jobPositionRepository");
const employeeSpecialtyRepository = require("../repositories/employeeSpecialtyRepository");
const userRepository = require("../repositories/userRepository");
const validators = require("../validators/employeeValidators");

const sortFields = {
  fullName: "e.full_name",
  employeeNumber: "e.employee_number",
  status: "e.status",
  contractStatus: "e.contract_status",
  hireDate: "e.hire_date",
  createdAt: "e.created_at"
};

const financialKeys = ["baseSalary", "hourlyRate"];

async function list(tenantId, query) {
  const pagination = parsePagination(query, sortFields, "createdAt");
  const result = await employeeRepository.list(tenantId, query, pagination);
  return { items: result.items.map((item) => protectEmployee(item, { detail: false })), pagination: pagination.meta(result.total) };
}

async function get({ tenantId, id, requester }) {
  const employee = await requireEmployee(tenantId, id);
  const access = await accessFor(requester);
  const details = protectEmployee(employee, { detail: true, access });
  details.specialties = await employeeRepository.listSpecialties(tenantId, id);
  if (access.documents) details.documents = protectDocuments(await employeeRepository.listDocuments(tenantId, id), true);
  if (access.notes) details.notes = await employeeRepository.listNotes(tenantId, id, access.confidentialNotes);
  return details;
}

async function create({ tenantId, userId, roleId, ipAddress, data }) {
  validators.employee(data);
  await assertFinancialAllowed({ tenantId, roleId, data });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await validateEmployeeRelations(tenantId, data, null, connection);
    const id = await employeeRepository.create(tenantId, data, userId, connection);
    await syncSpecialties(tenantId, id, data, connection);
    if (data.userId) await employeeRepository.addUserLinkHistory(tenantId, id, null, data.userId, "Vinculo inicial", userId, connection);
    const created = await employeeRepository.findById(tenantId, id, connection);
    const safeCreated = protectEmployee(created, { detail: true });
    await auditRepository.create(connection, { tenantId, userId, action: "employee.create", entity: "employees", entityId: id, newData: safeCreated, ipAddress });
    await connection.commit();
    return protectEmployee(created, { detail: true, access: { financial: await hasFinancialAccess(tenantId, roleId) } });
  } catch (error) {
    await connection.rollback();
    throw friendlyDuplicate(error);
  } finally {
    connection.release();
  }
}

async function update({ tenantId, id, userId, roleId, ipAddress, data }) {
  validators.employee(data, true);
  await assertFinancialAllowed({ tenantId, roleId, data });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireEmployee(tenantId, id, connection);
    await validateEmployeeRelations(tenantId, data, id, connection);
    if (data.userId !== undefined && Number(data.userId || 0) !== Number(oldData.userId || 0)) {
      if ((oldData.userId || data.userId) && !data.reason) throw new AppError("Motivo e obrigatorio para trocar ou remover usuario vinculado", 400);
      await employeeRepository.addUserLinkHistory(tenantId, id, oldData.userId, data.userId || null, data.reason, userId, connection);
    }
    await employeeRepository.update(tenantId, id, data, userId, connection);
    await syncSpecialties(tenantId, id, data, connection);
    const newData = await employeeRepository.findById(tenantId, id, connection);
    if (oldData.status !== newData.status || oldData.contractStatus !== newData.contractStatus) {
      await employeeRepository.addStatusHistory(tenantId, id, oldData.status, newData.status, oldData.contractStatus, newData.contractStatus, data.reason, userId, connection);
    }
    await auditRepository.create(connection, { tenantId, userId, action: "employee.update", entity: "employees", entityId: id, oldData: protectEmployee(oldData, { detail: true }), newData: protectEmployee(newData, { detail: true }), ipAddress });
    await connection.commit();
    return protectEmployee(newData, { detail: true, access: { financial: await hasFinancialAccess(tenantId, roleId) } });
  } catch (error) {
    await connection.rollback();
    throw friendlyDuplicate(error);
  } finally {
    connection.release();
  }
}

async function activate({ tenantId, id, userId, ipAddress }) {
  return statusChange({ tenantId, id, userId, ipAddress, status: "active", contractStatus: "active", action: "employee.activate" });
}

async function deactivate({ tenantId, id, userId, roleId, ipAddress, data }) {
  if (!data.reason) throw new AppError("Motivo e obrigatorio", 400);
  return statusChange({ tenantId, id, userId, roleId, ipAddress, status: "inactive", action: "employee.deactivate", reason: data.reason, userAction: data.userAction });
}

async function terminate({ tenantId, id, userId, roleId, ipAddress, data }) {
  if (!data.reason) throw new AppError("Motivo e obrigatorio", 400);
  if (!data.terminationDate) throw new AppError("Data de encerramento e obrigatoria", 400);
  validators.employee({ terminationDate: data.terminationDate, contractStatus: "terminated", hireDate: data.hireDate }, true);
  return statusChange({ tenantId, id, userId, roleId, ipAddress, status: "inactive", contractStatus: "terminated", terminationDate: data.terminationDate, action: "employee.terminate", reason: data.reason, userAction: data.userAction });
}

async function statusChange({ tenantId, id, userId, roleId, ipAddress, status, contractStatus, terminationDate, action, reason, userAction }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireEmployee(tenantId, id, connection);
    if (terminationDate && new Date(terminationDate) < new Date(oldData.hireDate)) throw new AppError("Data de encerramento nao pode ser anterior a admissao", 400);
    await handleLinkedUser({ tenantId, employee: oldData, userAction, requesterRoleId: roleId, requesterUserId: userId, connection });
    const data = { status };
    if (contractStatus) data.contractStatus = contractStatus;
    if (terminationDate) data.terminationDate = terminationDate;
    await employeeRepository.setStatusContract(tenantId, id, data, userId, connection);
    const newData = await employeeRepository.findById(tenantId, id, connection);
    await employeeRepository.addStatusHistory(tenantId, id, oldData.status, newData.status, oldData.contractStatus, newData.contractStatus, reason, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: "employees", entityId: id, oldData: protectEmployee(oldData, { detail: true }), newData: { ...protectEmployee(newData, { detail: true }), reason }, ipAddress });
    await connection.commit();
    return protectEmployee(newData, { detail: true, access: { financial: await hasFinancialAccess(tenantId, roleId) } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function remove({ tenantId, id, userId, ipAddress }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireEmployee(tenantId, id, connection);
    await employeeRepository.softDelete(tenantId, id, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "employee.delete", entity: "employees", entityId: id, oldData: protectEmployee(oldData, { detail: true }), newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateUserLink({ tenantId, id, userId, ipAddress, data }) {
  if (!data.userId) throw new AppError("Usuario e obrigatorio", 400);
  if (!data.reason) throw new AppError("Motivo e obrigatorio", 400);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireEmployee(tenantId, id, connection);
    await validateEmployeeRelations(tenantId, { userId: data.userId }, id, connection);
    await employeeRepository.update(tenantId, id, { userId: data.userId }, userId, connection);
    await employeeRepository.addUserLinkHistory(tenantId, id, oldData.userId, data.userId, data.reason, userId, connection);
    const newData = await employeeRepository.findById(tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "employee.user_link.update", entity: "employees", entityId: id, oldData: { userId: oldData.userId }, newData: { userId: data.userId, reason: data.reason }, ipAddress });
    await connection.commit();
    return protectEmployee(newData, { detail: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function removeUserLink({ tenantId, id, userId, ipAddress, data }) {
  if (!data.reason) throw new AppError("Motivo e obrigatorio", 400);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireEmployee(tenantId, id, connection);
    await employeeRepository.update(tenantId, id, { userId: null }, userId, connection);
    await employeeRepository.addUserLinkHistory(tenantId, id, oldData.userId, null, data.reason, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "employee.user_link.delete", entity: "employees", entityId: id, oldData: { userId: oldData.userId }, newData: { userId: null, reason: data.reason }, ipAddress });
    await connection.commit();
    return { id, userId: null };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function validateEmployeeRelations(tenantId, data, ignoreEmployeeId, connection) {
  if (data.employeeNumber && await employeeRepository.existsEmployeeNumber(tenantId, data.employeeNumber, ignoreEmployeeId, connection)) throw new AppError("Ja existe funcionario com este numero nesta empresa", 409);
  if (data.taxNumber && await employeeRepository.existsTaxNumber(tenantId, data.taxNumber, ignoreEmployeeId, connection)) throw new AppError("Ja existe funcionario com este numero fiscal nesta empresa", 409);
  if (data.sectorId && !await sectorRepository.findById(tenantId, data.sectorId, connection)) throw new AppError("Setor invalido para esta empresa", 400);
  if (data.jobPositionId && !await jobPositionRepository.findById(tenantId, data.jobPositionId, connection)) throw new AppError("Cargo invalido para esta empresa", 400);
  if (data.userId) {
    if (!await userRepository.findById(tenantId, data.userId, connection)) throw new AppError("Usuario invalido para esta empresa", 400);
    if (await employeeRepository.userLinkedElsewhere(tenantId, data.userId, ignoreEmployeeId, connection)) throw new AppError("Usuario ja esta vinculado a outro funcionario", 409);
  }
  await validateSpecialties(tenantId, data.specialtyIds, data.primarySpecialtyId, connection);
}

async function validateSpecialties(tenantId, specialtyIds, primarySpecialtyId, connection) {
  if (!specialtyIds) return;
  const unique = [...new Set(specialtyIds.map(Number))];
  if (unique.length !== specialtyIds.length) throw new AppError("Especialidades duplicadas", 400);
  if (primarySpecialtyId && !unique.includes(Number(primarySpecialtyId))) throw new AppError("Especialidade principal deve estar na lista", 400);
  for (const specialtyId of unique) {
    const specialty = await employeeSpecialtyRepository.findById(tenantId, specialtyId, connection);
    if (!specialty) throw new AppError("Especialidade invalida para esta empresa", 400);
  }
}

async function syncSpecialties(tenantId, employeeId, data, connection) {
  if (data.specialtyIds) await employeeRepository.replaceSpecialties(tenantId, employeeId, [...new Set(data.specialtyIds.map(Number))], data.primarySpecialtyId, connection);
}

async function handleLinkedUser({ tenantId, employee, userAction, requesterRoleId, requesterUserId, connection }) {
  if (!employee.userId || employee.userStatus !== "active") return;
  if (!userAction) throw new AppError("Funcionario possui usuario ativo vinculado. Informe userAction.", 400);
  if (userAction === "keep_active") return;
  if (userAction !== "deactivate_user") throw new AppError("Acao de usuario invalida", 400);
  if (!await permissionRepository.roleHasPermission({ roleId: requesterRoleId, tenantId, permissionCode: "users.update" })) throw new AppError("Permissao insuficiente para desativar usuario vinculado", 403);
  const linkedUser = await userRepository.findById(tenantId, employee.userId, connection);
  if (linkedUser.roleIsAdmin && linkedUser.status === "active" && await userRepository.countActiveAdmins(tenantId, connection) <= 1) throw new AppError("Nao e permitido alterar o ultimo administrador ativo", 400);
  if (Number(linkedUser.id) === Number(requesterUserId)) throw new AppError("Voce nao pode desativar seu proprio usuario pelo funcionario", 400);
  await userRepository.setStatus(tenantId, employee.userId, "inactive", requesterUserId, connection);
}

async function assertFinancialAllowed({ tenantId, roleId, data }) {
  if (!financialKeys.some((key) => data[key] !== undefined)) return;
  const allowed = await hasFinancialAccess(tenantId, roleId);
  if (!allowed) throw new AppError("Permissao insuficiente para alterar dados financeiros", 403);
}

async function hasFinancialAccess(tenantId, roleId) {
  if (!roleId) return false;
  return permissionRepository.roleHasPermission({ roleId, tenantId, permissionCode: "employees.view_financial_data" });
}

async function accessFor(user) {
  return {
    financial: await permissionRepository.roleHasPermission({ roleId: user.roleId, tenantId: user.tenantId, permissionCode: "employees.view_financial_data" }),
    documents: await permissionRepository.roleHasPermission({ roleId: user.roleId, tenantId: user.tenantId, permissionCode: "employees.view_documents" }),
    notes: await permissionRepository.roleHasPermission({ roleId: user.roleId, tenantId: user.tenantId, permissionCode: "employee_notes.read" }),
    confidentialNotes: await permissionRepository.roleHasPermission({ roleId: user.roleId, tenantId: user.tenantId, permissionCode: "employee_notes.read_confidential" })
  };
}

async function requireEmployee(tenantId, id, connection) {
  const employee = await employeeRepository.findById(tenantId, id, connection);
  if (!employee) throw new AppError("Funcionario nao encontrado", 404);
  return employee;
}

function mask(value) {
  if (!value) return null;
  const text = String(value);
  const tail = text.slice(-4);
  return `${"*".repeat(Math.max(text.length - 4, 3))}${tail}`;
}

function protectEmployee(employee, options = {}) {
  const item = { ...employee };
  item.taxNumber = mask(item.taxNumber);
  item.identityDocument = mask(item.identityDocument);
  item.socialSecurityNumber = mask(item.socialSecurityNumber);
  if (!options.access || !options.access.financial) {
    delete item.baseSalary;
    delete item.hourlyRate;
  }
  if (!options.detail) {
    delete item.notes;
    delete item.emergencyContactPhone;
  }
  return item;
}

function protectDocuments(documents, canViewFile) {
  return documents.map((document) => ({
    ...document,
    documentNumber: mask(document.documentNumber),
    fileUrl: canViewFile ? document.fileUrl : undefined
  }));
}

function friendlyDuplicate(error) {
  if (error && error.code === "ER_DUP_ENTRY") return new AppError("Registro duplicado para esta empresa", 409);
  return error;
}

module.exports = {
  list,
  get,
  create,
  update,
  activate,
  deactivate,
  terminate,
  remove,
  updateUserLink,
  removeUserLink,
  requireEmployee,
  accessFor,
  protectDocuments
};
