const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const loginHistoryRepository = require("../repositories/loginHistoryRepository");
const userRepository = require("../repositories/userRepository");
const sectorRepository = require("../repositories/sectorRepository");
const roleRepository = require("../repositories/roleRepository");
const {
  normalizeEmail,
  normalizeUsername,
  validatePassword,
  validateUserCreate,
  validateUserUpdate
} = require("../validators/accessValidators");

const sortFields = {
  name: "users.name",
  email: "users.email",
  status: "users.status",
  createdAt: "users.created_at"
};

async function list(tenantId, query) {
  const pagination = parsePagination(query, sortFields, "createdAt");
  const result = await userRepository.list(tenantId, query, pagination);
  return { items: result.items, pagination: pagination.meta(result.total) };
}

async function get(tenantId, id) {
  const user = await userRepository.findById(tenantId, id);
  if (!user) throw new AppError("Usuario nao encontrado", 404);
  return user;
}

async function create({ tenantId, userId, ipAddress, data }) {
  validateUserCreate(data);
  data.email = normalizeEmail(data.email);
  data.username = normalizeUsername(data.username);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await validateRelations(tenantId, data.sectorId, data.roleId, connection);
    await validateUniqueUser(tenantId, data.email, data.username, null, connection);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = await userRepository.create(tenantId, data, passwordHash, userId, connection);
    const created = await userRepository.findById(tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "user.create", entity: "users", entityId: id, newData: created, ipAddress });
    await connection.commit();
    return created;
  } catch (error) {
    await connection.rollback();
    throw friendlyDuplicate(error);
  } finally {
    connection.release();
  }
}

async function update({ tenantId, targetId, userId, ipAddress, data }) {
  validateUserUpdate(data);
  if (data.email) data.email = normalizeEmail(data.email);
  if (data.username !== undefined) data.username = normalizeUsername(data.username);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireUser(tenantId, targetId, connection);
    await validateRelations(tenantId, data.sectorId, data.roleId, connection);
    await validateUniqueUser(tenantId, data.email, data.username, targetId, connection);
    if (data.status && data.status !== "active") await ensureNotLastAdmin(tenantId, oldData, connection);
    await userRepository.update(tenantId, targetId, data, userId, connection);
    const newData = await userRepository.findById(tenantId, targetId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "user.update", entity: "users", entityId: targetId, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw friendlyDuplicate(error);
  } finally {
    connection.release();
  }
}

async function block({ tenantId, targetId, userId, ipAddress, reason }) {
  if (Number(targetId) === Number(userId)) throw new AppError("Voce nao pode bloquear a si proprio", 400);
  return changeStatus({ tenantId, targetId, userId, ipAddress, status: "blocked", action: "user.block", reason });
}

async function activate({ tenantId, targetId, userId, ipAddress }) {
  return changeStatus({ tenantId, targetId, userId, ipAddress, status: "active", action: "user.activate" });
}

async function deactivate({ tenantId, targetId, userId, ipAddress }) {
  if (Number(targetId) === Number(userId)) throw new AppError("Voce nao pode desativar a si proprio", 400);
  return changeStatus({ tenantId, targetId, userId, ipAddress, status: "inactive", action: "user.deactivate" });
}

async function changeStatus({ tenantId, targetId, userId, ipAddress, status, action, reason }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireUser(tenantId, targetId, connection);
    if (status !== "active") await ensureNotLastAdmin(tenantId, oldData, connection);
    await userRepository.setStatus(tenantId, targetId, status, userId, connection);
    const newData = await userRepository.findById(tenantId, targetId, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: "users", entityId: targetId, oldData: { ...oldData, reason }, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function resetPassword({ tenantId, targetId, userId, ipAddress, temporaryPassword }) {
  validatePassword(temporaryPassword);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireUser(tenantId, targetId, connection);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await userRepository.resetPassword(tenantId, targetId, passwordHash, userId, connection);
    const newData = await userRepository.findById(tenantId, targetId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "user.reset_password", entity: "users", entityId: targetId, oldData, newData: { ...newData, passwordReset: true }, ipAddress });
    await connection.commit();
    return { id: targetId, mustChangePassword: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function remove({ tenantId, targetId, userId, ipAddress }) {
  if (Number(targetId) === Number(userId)) throw new AppError("Voce nao pode excluir a si proprio", 400);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireUser(tenantId, targetId, connection);
    await ensureNotLastAdmin(tenantId, oldData, connection);
    await userRepository.softDelete(tenantId, targetId, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "user.delete", entity: "users", entityId: targetId, oldData, newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id: targetId, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function loginHistory(tenantId, userId, query) {
  await get(tenantId, userId);
  const pagination = parsePagination(query, { createdAt: "created_at" }, "createdAt");
  const result = await loginHistoryRepository.listByUser(tenantId, userId, pagination);
  return { items: result.rows, pagination: pagination.meta(result.total) };
}

async function validateRelations(tenantId, sectorId, roleId, connection) {
  if (sectorId && !(await sectorRepository.findById(tenantId, sectorId, connection))) {
    throw new AppError("Setor invalido para esta empresa", 400);
  }
  if (roleId && !(await roleRepository.findById(tenantId, roleId, connection))) {
    throw new AppError("Perfil invalido para esta empresa", 400);
  }
}

async function validateUniqueUser(tenantId, email, username, ignoreId, connection) {
  if (email && (await userRepository.existsByEmail(tenantId, email, ignoreId, connection))) {
    throw new AppError("Ja existe usuario com este e-mail nesta empresa", 409);
  }
  if (username && (await userRepository.existsByUsername(tenantId, username, ignoreId, connection))) {
    throw new AppError("Ja existe usuario com este username nesta empresa", 409);
  }
}

async function requireUser(tenantId, id, connection) {
  const user = await userRepository.findById(tenantId, id, connection);
  if (!user) throw new AppError("Usuario nao encontrado", 404);
  return user;
}

async function ensureNotLastAdmin(tenantId, user, connection) {
  if (!user.roleIsAdmin || user.status !== "active") return;
  const total = await userRepository.countActiveAdmins(tenantId, connection);
  if (total <= 1) throw new AppError("Nao e permitido alterar o ultimo administrador ativo", 400);
}

function friendlyDuplicate(error) {
  if (error && error.code === "ER_DUP_ENTRY") {
    return new AppError("Registro duplicado para esta empresa", 409);
  }
  return error;
}

module.exports = { list, get, create, update, block, activate, deactivate, resetPassword, remove, loginHistory };
