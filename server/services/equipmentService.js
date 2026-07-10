const pool = require("../config/database");
const AppError = require("../utils/AppError");
const auditRepository = require("../repositories/auditRepository");
const crud = require("./workshopCrudService");
const repo = require("../repositories/workshopRepository");
const { validateEquipment, requireReasonForStatus } = require("../validators/workshopValidators");

const table = repo.tables.equipment;
const sortFields = { name: "name", code: "code", status: "status", operationalStatus: "operational_status", nextMaintenanceDate: "next_maintenance_date", createdAt: "created_at" };

async function ensureRelations(connection, tenantId, data) {
  if (data.equipmentTypeId && !(await repo.findById(repo.tables.equipmentTypes, tenantId, data.equipmentTypeId, connection))) {
    throw new AppError("O tipo de equipamento nao pertence a empresa autenticada", 400);
  }
  if (data.bayId) {
    const bay = await repo.findById(repo.tables.bays, tenantId, data.bayId, connection);
    if (!bay) throw new AppError("A baia selecionada nao pertence a empresa autenticada", 400);
    if (bay.status !== "active") throw new AppError("Nao e permitido vincular equipamento a baia inativa", 400);
  }
}

async function get(tenantId, id) {
  const equipment = await crud.get({ table, tenantId, id });
  const [history] = await pool.execute(
    "SELECT previous_status AS previousStatus, new_status AS newStatus, reason, created_at AS createdAt FROM equipment_status_history WHERE tenant_id = ? AND equipment_id = ? ORDER BY created_at DESC LIMIT 5",
    [tenantId, id]
  );
  const [maintenance] = await pool.execute(
    "SELECT id, maintenance_type AS maintenanceType, status, scheduled_date AS scheduledDate, completed_at AS completedAt FROM equipment_maintenance_records WHERE tenant_id = ? AND equipment_id = ? AND deleted_at IS NULL ORDER BY scheduled_date DESC LIMIT 5",
    [tenantId, id]
  );
  equipment.history = history;
  equipment.maintenance = maintenance;
  return equipment;
}

async function changeStatus({ tenantId, id, userId, ipAddress, operationalStatus, reason }) {
  requireReasonForStatus(operationalStatus, reason, ["maintenance", "unavailable", "retired"]);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await repo.findById(table, tenantId, id, connection);
    if (!oldData) throw new AppError("Equipamento nao encontrado", 404);
    if (oldData.operational_status === "retired" && operationalStatus === "available") {
      throw new AppError("Equipamento retired nao pode voltar automaticamente para available", 400);
    }
    await repo.update(table, tenantId, id, { operationalStatus }, userId, connection);
    await connection.execute(
      `INSERT INTO equipment_status_history (tenant_id, equipment_id, previous_status, new_status, reason, changed_by)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, id, oldData.operational_status, operationalStatus, reason || null, userId]
    );
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "equipment.status.update", entity: table, entityId: id, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function history(tenantId, id) {
  await get(tenantId, id);
  const [rows] = await pool.execute(
    "SELECT id, previous_status AS previousStatus, new_status AS newStatus, reason, changed_by AS changedBy, created_at AS createdAt FROM equipment_status_history WHERE tenant_id = ? AND equipment_id = ? ORDER BY created_at DESC",
    [tenantId, id]
  );
  return rows;
}

module.exports = {
  list: (tenantId, query) => crud.list({ table, tenantId, query, sortFields, defaultSortBy: "createdAt" }),
  get,
  create: (ctx) => crud.create({ ...ctx, table, validate: validateEquipment, auditAction: "equipment.create", entity: table, afterValidate: (connection, data) => ensureRelations(connection, ctx.tenantId, data) }),
  update: (ctx) => crud.update({ ...ctx, table, validate: validateEquipment, auditAction: "equipment.update", entity: table, afterValidate: (connection, data) => ensureRelations(connection, ctx.tenantId, data) }),
  changeStatus,
  history,
  remove: (ctx) => crud.remove({
    ...ctx,
    table,
    auditAction: "equipment.delete",
    entity: table,
    beforeDelete: async (connection, equipment) => {
      const total = await repo.count(repo.tables.maintenance, ctx.tenantId, "equipment_id", equipment.id, connection, "AND status = 'in_progress'");
      if (total > 0) throw new AppError("Nao e possivel excluir equipamento com manutencao em andamento", 400);
    }
  })
};
