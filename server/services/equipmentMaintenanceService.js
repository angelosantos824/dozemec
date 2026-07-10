const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const repo = require("../repositories/workshopRepository");
const { validateMaintenance } = require("../validators/workshopValidators");

const table = repo.tables.maintenance;
const sortFields = { scheduledDate: "m.scheduled_date", status: "m.status", createdAt: "m.created_at", equipmentName: "e.name" };

async function list(tenantId, query) {
  const pagination = parsePagination(query, sortFields, "scheduledDate");
  const where = ["m.tenant_id = ?", "m.deleted_at IS NULL"];
  const values = [tenantId];
  if (query.equipmentId) {
    where.push("m.equipment_id = ?");
    values.push(query.equipmentId);
  }
  if (query.maintenanceStatus || query.status) {
    where.push("m.status = ?");
    values.push(query.maintenanceStatus || query.status);
  }
  if (query.maintenanceType) {
    where.push("m.maintenance_type = ?");
    values.push(query.maintenanceType);
  }
  if (query.search) {
    where.push("(e.name LIKE ? OR e.code LIKE ? OR m.description LIKE ?)");
    values.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
  }
  const whereSql = where.join(" AND ");
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM ${table} m
    INNER JOIN workshop_equipment e ON e.tenant_id = m.tenant_id AND e.id = m.equipment_id
    WHERE ${whereSql}`,
    values
  );
  const [items] = await pool.execute(
    `SELECT m.*, e.name AS equipment_name, e.code AS equipment_code, e.bay_id
    FROM ${table} m
    INNER JOIN workshop_equipment e ON e.tenant_id = m.tenant_id AND e.id = m.equipment_id
    WHERE ${whereSql}
    ORDER BY ${pagination.sortColumn} ${pagination.sortOrder}
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
    values
  );
  return { items, pagination: pagination.meta(countRows[0].total) };
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
    if (oldData.status === "in_progress") throw new AppError("Manutencao ja esta em andamento", 400);
    if (oldData.status !== "scheduled") throw new AppError("Somente manutencoes agendadas podem ser iniciadas", 400);
    const equipment = await ensureEquipment(connection, tenantId, oldData.equipment_id);
    await repo.update(table, tenantId, id, { status: "in_progress", startedAt: new Date() }, userId, connection);
    if (equipment.operational_status !== "maintenance") {
      await repo.update(repo.tables.equipment, tenantId, equipment.id, { operationalStatus: "maintenance" }, userId, connection);
      await connection.execute("INSERT INTO equipment_status_history (tenant_id, equipment_id, previous_status, new_status, reason, changed_by) VALUES (?, ?, ?, 'maintenance', 'Inicio de manutencao', ?)", [tenantId, equipment.id, equipment.operational_status, userId]);
    }
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
    if (oldData.status === "cancelled") throw new AppError("Nao e possivel concluir manutencao cancelada", 400);
    if (oldData.status !== "in_progress") throw new AppError("Somente manutencoes em andamento podem ser concluidas", 400);
    const equipment = await ensureEquipment(connection, tenantId, oldData.equipment_id);
    const completedAt = data.completedAt || new Date();
    const nextDateSql = equipment.maintenance_interval_days ? "DATE_ADD(DATE(?), INTERVAL ? DAY)" : "NULL";
    const equipmentOperationalStatus = data.equipmentOperationalStatus || "available";
    await connection.execute(
      `UPDATE equipment_maintenance_records SET status = 'completed', completed_at = ?, cost = COALESCE(?, cost), notes = COALESCE(?, notes), updated_by = ? WHERE tenant_id = ? AND id = ?`,
      [completedAt, data.cost ?? null, data.notes || null, userId, tenantId, id]
    );
    await connection.execute(
      `UPDATE workshop_equipment SET operational_status = ?, last_maintenance_date = DATE(?), next_maintenance_date = ${nextDateSql}, updated_by = ? WHERE tenant_id = ? AND id = ?`,
      equipment.maintenance_interval_days
        ? [equipmentOperationalStatus, completedAt, completedAt, equipment.maintenance_interval_days, userId, tenantId, equipment.id]
        : [equipmentOperationalStatus, completedAt, userId, tenantId, equipment.id]
    );
    if (equipment.operational_status !== equipmentOperationalStatus) {
      await connection.execute("INSERT INTO equipment_status_history (tenant_id, equipment_id, previous_status, new_status, reason, changed_by) VALUES (?, ?, ?, ?, 'Conclusao de manutencao', ?)", [tenantId, equipment.id, equipment.operational_status, equipmentOperationalStatus, userId]);
    }
    if (equipment.bay_id && data.releaseBay !== false) {
      const bay = await repo.findById(repo.tables.bays, tenantId, equipment.bay_id, connection);
      if (bay && bay.operational_status === "maintenance") {
        const [blockers] = await connection.execute(
          `SELECT COUNT(*) AS total
          FROM workshop_equipment e
          LEFT JOIN equipment_maintenance_records m ON m.tenant_id = e.tenant_id
            AND m.equipment_id = e.id
            AND m.deleted_at IS NULL
            AND m.status = 'in_progress'
          WHERE e.tenant_id = ? AND e.bay_id = ? AND e.deleted_at IS NULL
            AND (e.operational_status = 'maintenance' OR m.id IS NOT NULL)`,
          [tenantId, equipment.bay_id]
        );
        if (blockers[0].total === 0) {
          await repo.update(repo.tables.bays, tenantId, equipment.bay_id, { operationalStatus: "available" }, userId, connection);
          await connection.execute(
            `INSERT INTO bay_status_history (tenant_id, bay_id, previous_status, new_status, reason, changed_by)
            VALUES (?, ?, ?, 'available', 'Conclusao de manutencao do equipamento', ?)`,
            [tenantId, equipment.bay_id, bay.operational_status, userId]
          );
        }
      }
    }
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
    if (oldData.status === "cancelled") throw new AppError("Manutencao ja cancelada", 400);
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
