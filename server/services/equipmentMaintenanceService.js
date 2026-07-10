const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const repo = require("../repositories/workshopRepository");
const { validateMaintenance } = require("../validators/workshopValidators");

const table = repo.tables.maintenance;
const sortFields = { scheduledDate: "scheduled_date", status: "status", createdAt: "created_at" };

async function list(tenantId, query) {
  const pagination = parsePagination(query, sortFields, "scheduledDate");
  const result = await repo.list(table, tenantId, query, pagination);
  return { items: result.items, pagination: pagination.meta(result.total) };
}

async function get(tenantId, id) {
  const item = await repo.findById(table, tenantId, id);
  if (!item) throw new AppError("Manutencao nao encontrada", 404);
  return item;
}

async function ensureEquipment(connection, tenantId, equipmentId) {
  const equipment = await repo.findById(repo.tables.equipment, tenantId, equipmentId, connection);
  if (!equipment) throw new AppError("O equipamento nao pertence a empresa autenticada", 400);
  return equipment;
}

async function create({ tenantId, userId, ipAddress, data }) {
  validateMaintenance(data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureEquipment(connection, tenantId, data.equipmentId);
    const id = await repo.create(table, tenantId, data, userId, connection);
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "equipment_maintenance.create", entity: table, entityId: id, newData, ipAddress });
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
  validateMaintenance(data, true);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await getForUpdate(connection, tenantId, id);
    if (data.equipmentId) await ensureEquipment(connection, tenantId, data.equipmentId);
    await repo.update(table, tenantId, id, data, userId, connection);
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "equipment_maintenance.update", entity: table, entityId: id, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function start({ tenantId, id, userId, ipAddress }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await getForUpdate(connection, tenantId, id);
    if (["completed", "cancelled"].includes(oldData.status)) throw new AppError("Nao e possivel iniciar manutencao concluida ou cancelada", 400);
    const equipment = await ensureEquipment(connection, tenantId, oldData.equipment_id);
    await repo.update(table, tenantId, id, { status: "in_progress", startedAt: new Date() }, userId, connection);
    await repo.update(repo.tables.equipment, tenantId, equipment.id, { operationalStatus: "maintenance" }, userId, connection);
    await connection.execute("INSERT INTO equipment_status_history (tenant_id, equipment_id, previous_status, new_status, reason, changed_by) VALUES (?, ?, ?, 'maintenance', 'Inicio de manutencao', ?)", [tenantId, equipment.id, equipment.operational_status, userId]);
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "equipment_maintenance.start", entity: table, entityId: id, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function complete({ tenantId, id, userId, ipAddress, data }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await getForUpdate(connection, tenantId, id);
    if (oldData.status === "completed") throw new AppError("Manutencao ja concluida", 400);
    const equipment = await ensureEquipment(connection, tenantId, oldData.equipment_id);
    const completedAt = data.completedAt || new Date();
    const nextDateSql = equipment.maintenance_interval_days ? "DATE_ADD(DATE(?), INTERVAL ? DAY)" : "NULL";
    await connection.execute(
      `UPDATE equipment_maintenance_records SET status = 'completed', completed_at = ?, cost = COALESCE(?, cost), notes = COALESCE(?, notes), updated_by = ? WHERE tenant_id = ? AND id = ?`,
      [completedAt, data.cost ?? null, data.notes || null, userId, tenantId, id]
    );
    await connection.execute(
      `UPDATE workshop_equipment SET operational_status = ?, last_maintenance_date = DATE(?), next_maintenance_date = ${nextDateSql}, updated_by = ? WHERE tenant_id = ? AND id = ?`,
      equipment.maintenance_interval_days
        ? [data.equipmentOperationalStatus || "available", completedAt, completedAt, equipment.maintenance_interval_days, userId, tenantId, equipment.id]
        : [data.equipmentOperationalStatus || "available", completedAt, userId, tenantId, equipment.id]
    );
    await connection.execute("INSERT INTO equipment_status_history (tenant_id, equipment_id, previous_status, new_status, reason, changed_by) VALUES (?, ?, ?, ?, 'Conclusao de manutencao', ?)", [tenantId, equipment.id, equipment.operational_status, data.equipmentOperationalStatus || "available", userId]);
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "equipment_maintenance.complete", entity: table, entityId: id, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancel({ tenantId, id, userId, ipAddress, reason }) {
  if (!reason) throw new AppError("O motivo e obrigatorio", 400);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await getForUpdate(connection, tenantId, id);
    if (oldData.status === "completed") throw new AppError("Nao e possivel cancelar manutencao concluida", 400);
    await repo.update(table, tenantId, id, { status: "cancelled", notes: reason }, userId, connection);
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "equipment_maintenance.cancel", entity: table, entityId: id, oldData, newData, ipAddress });
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
    const oldData = await getForUpdate(connection, tenantId, id);
    if (["completed", "in_progress"].includes(oldData.status)) throw new AppError("Nao e possivel excluir manutencao concluida ou em andamento", 400);
    await repo.softDelete(table, tenantId, id, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "equipment_maintenance.delete", entity: table, entityId: id, oldData, newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getForUpdate(connection, tenantId, id) {
  const item = await repo.findById(table, tenantId, id, connection);
  if (!item) throw new AppError("Manutencao nao encontrada", 404);
  return item;
}

module.exports = { list, get, create, update, start, complete, cancel, remove };
