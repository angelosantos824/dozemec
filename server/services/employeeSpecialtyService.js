const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const repo = require("../repositories/employeeSpecialtyRepository");
const validators = require("../validators/employeeValidators");

const sortFields = { name: "name", code: "code", status: "status", displayOrder: "display_order", createdAt: "created_at" };

async function list(tenantId, query) {
  const pagination = parsePagination(query, sortFields, "displayOrder");
  const result = await repo.list(tenantId, query, pagination);
  return { items: result.items, pagination: pagination.meta(result.total) };
}

async function get(tenantId, id) {
  const item = await repo.findById(tenantId, id);
  if (!item) throw new AppError("Especialidade nao encontrada", 404);
  return item;
}

async function create({ tenantId, userId, ipAddress, data }) {
  validators.catalog(data);
  return persist({ tenantId, userId, ipAddress, data, action: "employee_specialty.create" });
}

async function update({ tenantId, id, userId, ipAddress, data }) {
  validators.catalog(data, true);
  return persist({ tenantId, id, userId, ipAddress, data, action: "employee_specialty.update" });
}

async function remove({ tenantId, id, userId, ipAddress }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireItem(tenantId, id, connection);
    if (await repo.countActiveEmployees(tenantId, id, connection)) throw new AppError("Nao e permitido excluir especialidade vinculada a funcionario ativo", 400);
    await repo.softDelete(tenantId, id, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "employee_specialty.delete", entity: "employee_specialties", entityId: id, oldData, newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function persist({ tenantId, id, userId, ipAddress, data, action }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = id ? await requireItem(tenantId, id, connection) : null;
    if (data.code) {
      const duplicate = await repo.findByCode(tenantId, data.code, connection);
      if (duplicate && Number(duplicate.id) !== Number(id)) throw new AppError("Ja existe especialidade com este codigo nesta empresa", 409);
    }
    const itemId = id || await repo.create(tenantId, data, userId, connection);
    if (id) await repo.update(tenantId, id, data, userId, connection);
    const newData = await repo.findById(tenantId, itemId, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: "employee_specialties", entityId: itemId, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function requireItem(tenantId, id, connection) {
  const item = await repo.findById(tenantId, id, connection);
  if (!item) throw new AppError("Especialidade nao encontrada", 404);
  return item;
}

module.exports = { list, get, create, update, remove };
