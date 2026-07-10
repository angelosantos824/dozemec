const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const sectorRepository = require("../repositories/sectorRepository");
const { normalizeCode, validateSector } = require("../validators/accessValidators");

const sortFields = { name: "name", code: "code", status: "status", displayOrder: "display_order", createdAt: "created_at" };

async function list(tenantId, query) {
  const pagination = parsePagination(query, sortFields, "displayOrder");
  const result = await sectorRepository.list(tenantId, query, pagination);
  return { items: result.items, pagination: pagination.meta(result.total) };
}

async function get(tenantId, id) {
  const sector = await sectorRepository.findById(tenantId, id);
  if (!sector) throw new AppError("Setor nao encontrado", 404);
  return sector;
}

async function create({ tenantId, userId, ipAddress, data }) {
  validateSector(data);
  data.code = normalizeCode(data.code || data.name);
  return write({ tenantId, userId, ipAddress, data, action: "sector.create" });
}

async function update({ tenantId, id, userId, ipAddress, data }) {
  validateSector(data, true);
  if (data.code !== undefined || data.name) data.code = normalizeCode(data.code || data.name);
  return write({ tenantId, id, userId, ipAddress, data, action: "sector.update" });
}

async function write({ tenantId, id, userId, ipAddress, data, action }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = id ? await requireSector(tenantId, id, connection) : null;
    if (data.code && (await sectorRepository.existsCode(tenantId, data.code, id, connection))) {
      throw new AppError("Ja existe setor com este codigo nesta empresa", 409);
    }
    const targetId = id || (await sectorRepository.create(tenantId, data, userId, connection));
    if (id) await sectorRepository.update(tenantId, id, data, userId, connection);
    const newData = await sectorRepository.findById(tenantId, targetId, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: "sectors", entityId: targetId, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
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
    const oldData = await requireSector(tenantId, id, connection);
    if ((await sectorRepository.activeUsersCount(tenantId, id, connection)) > 0) {
      throw new AppError("Nao e possivel excluir setor com usuarios ativos vinculados", 400);
    }
    await sectorRepository.softDelete(tenantId, id, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "sector.delete", entity: "sectors", entityId: id, oldData, newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function requireSector(tenantId, id, connection) {
  const sector = await sectorRepository.findById(tenantId, id, connection);
  if (!sector) throw new AppError("Setor nao encontrado", 404);
  return sector;
}

module.exports = { list, get, create, update, remove };
