const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const repo = require("../repositories/workshopRepository");

async function list({ table, tenantId, query, sortFields, defaultSortBy = "displayOrder" }) {
  const pagination = parsePagination(query, sortFields, defaultSortBy);
  const result = await repo.list(table, tenantId, query, pagination);
  return { items: result.items, pagination: pagination.meta(result.total) };
}

async function get({ table, tenantId, id }) {
  const item = await repo.findById(table, tenantId, id);
  if (!item) throw new AppError("Registro nao encontrado", 404);
  return item;
}

async function create({ table, tenantId, userId, ipAddress, data, validate, auditAction, entity, afterValidate }) {
  validate(data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (afterValidate) await afterValidate(connection, data);
    if (data.code && (await repo.findByCode(table, tenantId, data.code, connection))) {
      throw new AppError("Ja existe registro com este codigo nesta empresa", 409);
    }
    const id = await repo.create(table, tenantId, data, userId, connection);
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: auditAction, entity, entityId: id, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update({ table, tenantId, id, userId, ipAddress, data, validate, auditAction, entity, afterValidate }) {
  validate(data, true);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await repo.findById(table, tenantId, id, connection);
    if (!oldData) throw new AppError("Registro nao encontrado", 404);
    if (afterValidate) await afterValidate(connection, data, oldData);
    if (data.code) {
      const duplicate = await repo.findByCode(table, tenantId, data.code, connection);
      if (duplicate && Number(duplicate.id) !== Number(id)) throw new AppError("Ja existe registro com este codigo nesta empresa", 409);
    }
    await repo.update(table, tenantId, id, data, userId, connection);
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: auditAction, entity, entityId: id, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function remove({ table, tenantId, id, userId, ipAddress, auditAction, entity, beforeDelete }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await repo.findById(table, tenantId, id, connection);
    if (!oldData) throw new AppError("Registro nao encontrado", 404);
    if (beforeDelete) await beforeDelete(connection, oldData);
    await repo.softDelete(table, tenantId, id, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: auditAction, entity, entityId: id, oldData, newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { list, get, create, update, remove };
