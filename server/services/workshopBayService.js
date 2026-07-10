const pool = require("../config/database");
const AppError = require("../utils/AppError");
const auditRepository = require("../repositories/auditRepository");
const crud = require("./workshopCrudService");
const repo = require("../repositories/workshopRepository");
const { validateBay, requireReasonForStatus } = require("../validators/workshopValidators");

const table = repo.tables.bays;
const sortFields = { name: "name", code: "code", status: "status", operationalStatus: "operational_status", displayOrder: "display_order", createdAt: "created_at" };

async function ensureArea(connection, tenantId, areaId) {
  if (areaId && !(await repo.findById(repo.tables.areas, tenantId, areaId, connection))) {
    throw new AppError("A area selecionada nao pertence a empresa autenticada", 400);
  }
}

async function get(tenantId, id) {
  const bay = await crud.get({ table, tenantId, id });
  const [equipment] = await pool.execute(
    `SELECT id, name, code, operational_status AS operationalStatus
    FROM workshop_equipment WHERE tenant_id = ? AND bay_id = ? AND deleted_at IS NULL`,
    [tenantId, id]
  );
  bay.equipment = equipment;
  return bay;
}

async function changeStatus({ tenantId, id, userId, ipAddress, operationalStatus, reason }) {
  requireReasonForStatus(operationalStatus, reason, ["maintenance", "unavailable"]);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await repo.findById(table, tenantId, id, connection);
    if (!oldData) throw new AppError("Baia nao encontrada", 404);
    if (oldData.status !== "active") throw new AppError("Nao e permitido alterar estado de baia inativa", 400);
    await repo.update(table, tenantId, id, { operationalStatus }, userId, connection);
    await connection.execute(
      `INSERT INTO bay_status_history (tenant_id, bay_id, previous_status, new_status, reason, changed_by)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, id, oldData.operational_status, operationalStatus, reason || null, userId]
    );
    const newData = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "workshop_bay.status.update", entity: table, entityId: id, oldData, newData, ipAddress });
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
    "SELECT id, previous_status AS previousStatus, new_status AS newStatus, reason, changed_by AS changedBy, created_at AS createdAt FROM bay_status_history WHERE tenant_id = ? AND bay_id = ? ORDER BY created_at DESC",
    [tenantId, id]
  );
  return rows;
}

module.exports = {
  list: (tenantId, query) => crud.list({ table, tenantId, query, sortFields }),
  get,
  create: (ctx) => crud.create({ ...ctx, table, validate: validateBay, auditAction: "workshop_bay.create", entity: table, afterValidate: (connection, data) => ensureArea(connection, ctx.tenantId, data.areaId) }),
  update: (ctx) => crud.update({ ...ctx, table, validate: validateBay, auditAction: "workshop_bay.update", entity: table, afterValidate: (connection, data) => ensureArea(connection, ctx.tenantId, data.areaId) }),
  changeStatus,
  history,
  remove: (ctx) => crud.remove({
    ...ctx,
    table,
    auditAction: "workshop_bay.delete",
    entity: table,
    beforeDelete: async (connection, bay) => {
      if (bay.operational_status === "occupied") throw new AppError("Nao e possivel excluir baia ocupada", 400);
      const total = await repo.count(repo.tables.equipment, ctx.tenantId, "bay_id", bay.id, connection, "AND status = 'active'");
      if (total > 0) throw new AppError("Nao e possivel excluir baia com equipamento ativo vinculado", 400);
    }
  })
};
