const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const permissionRepository = require("../repositories/permissionRepository");
const roleRepository = require("../repositories/roleRepository");
const { normalizeCode, validatePermissionIds, validateRole } = require("../validators/accessValidators");

const sortFields = { name: "name", code: "code", status: "status", displayOrder: "display_order", createdAt: "created_at" };

async function list(tenantId, query) {
  const pagination = parsePagination(query, sortFields, "displayOrder");
  const result = await roleRepository.list(tenantId, query, pagination);
  return { items: result.items, pagination: pagination.meta(result.total) };
}

async function get(tenantId, id) {
  const role = await roleRepository.findWithPermissions(tenantId, id);
  if (!role) throw new AppError("Perfil nao encontrado", 404);
  return role;
}

async function create({ tenantId, userId, ipAddress, data }) {
  validateRole(data);
  data.code = normalizeCode(data.code || data.name);
  const permissionIds = data.permissionIds || [];
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (await roleRepository.existsCode(tenantId, data.code, null, connection)) {
      throw new AppError("Ja existe perfil com este codigo nesta empresa", 409);
    }
    if (!(await permissionRepository.idsExist(permissionIds, connection))) {
      throw new AppError("Uma ou mais permissoes nao existem", 400);
    }
    const id = await roleRepository.create(tenantId, data, userId, connection);
    await roleRepository.replacePermissions(id, permissionIds, connection);
    const newData = await roleRepository.findWithPermissions(tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "role.create", entity: "roles", entityId: id, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update({ tenantId, id, userId, ipAddress, data }) {
  validateRole(data, true);
  if (data.code !== undefined || data.name) data.code = normalizeCode(data.code || data.name);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireRole(tenantId, id, connection);
    if (data.code && (await roleRepository.existsCode(tenantId, data.code, id, connection))) {
      throw new AppError("Ja existe perfil com este codigo nesta empresa", 409);
    }
    await roleRepository.update(tenantId, id, data, userId, connection);
    const newData = await roleRepository.findWithPermissions(tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "role.update", entity: "roles", entityId: id, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updatePermissions({ tenantId, id, userId, ipAddress, permissionIds }) {
  validatePermissionIds(permissionIds);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireRole(tenantId, id, connection);
    if (oldData.isAdmin && permissionIds.length === 0) {
      throw new AppError("Nao e permitido remover todas as permissoes de um perfil administrador", 400);
    }
    if (!(await permissionRepository.idsExist(permissionIds, connection))) {
      throw new AppError("Uma ou mais permissoes nao existem", 400);
    }
    await roleRepository.replacePermissions(id, permissionIds, connection);
    const newData = await roleRepository.findWithPermissions(tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "role.permissions.update", entity: "roles", entityId: id, oldData, newData, ipAddress });
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
    const oldData = await requireRole(tenantId, id, connection);
    if (oldData.isSystemRole || oldData.isAdmin) throw new AppError("Nao e permitido excluir perfil do sistema ou administrador", 400);
    if ((await roleRepository.activeUsersCount(tenantId, id, connection)) > 0) {
      throw new AppError("Nao e possivel excluir perfil com usuarios ativos vinculados", 400);
    }
    await roleRepository.softDelete(tenantId, id, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "role.delete", entity: "roles", entityId: id, oldData, newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function requireRole(tenantId, id, connection) {
  const role = await roleRepository.findWithPermissions(tenantId, id, connection);
  if (!role) throw new AppError("Perfil nao encontrado", 404);
  return role;
}

module.exports = { list, get, create, update, updatePermissions, remove };
