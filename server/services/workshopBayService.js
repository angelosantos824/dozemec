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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await repo.findById(table, tenantId, id, connection);
    if (!oldData) throw new AppError("Baia nao encontrada", 404);
    if (oldData.status !== "active") throw new AppError("Nao e permitido alterar estado de baia inativa", 400);
    if (oldData.operational_status === operationalStatus) throw new AppError("A situacao selecionada ja e a situacao atual.", 400);
    requireReasonForStatus(operationalStatus, reason, ["maintenance", "unavailable"]);
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

async function listBayEquipment(connection, tenantId, bayId) {
  const [rows] = await connection.execute(
    `SELECT * FROM workshop_equipment
    WHERE tenant_id = ? AND bay_id = ? AND deleted_at IS NULL AND status = 'active'
    ORDER BY name ASC`,
    [tenantId, bayId]
  );
  return rows;
}

async function createMaintenance({ tenantId, id, userId, ipAddress, data }) {
  if (!data.reason) throw new AppError("O motivo e obrigatorio", 400);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldBay = await repo.findById(table, tenantId, id, connection);
    if (!oldBay) throw new AppError("Baia nao encontrada", 404);
    if (oldBay.status !== "active") throw new AppError("Nao e permitido alterar estado de baia inativa", 400);

    const equipment = await listBayEquipment(connection, tenantId, id);
    const selectedEquipmentId = data.equipmentId || (equipment.length === 1 && !data.blockOnly ? equipment[0].id : null);
    if (!data.blockOnly && equipment.length > 1 && !selectedEquipmentId) throw new AppError("Selecione o equipamento para abrir a manutencao", 400);

    let maintenance = null;
    let equipmentData = null;
    if (!data.blockOnly && selectedEquipmentId) {
      equipmentData = equipment.find((item) => Number(item.id) === Number(selectedEquipmentId));
      if (!equipmentData) throw new AppError("O equipamento selecionado nao esta vinculado a esta baia", 400);
      const [result] = await connection.execute(
        `INSERT INTO equipment_maintenance_records
        (tenant_id, equipment_id, maintenance_type, status, description, service_provider, technician_name, scheduled_date, notes, created_by)
        VALUES (?, ?, ?, 'scheduled', ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          equipmentData.id,
          data.maintenanceType || "preventive",
          data.description || data.reason,
          data.serviceProvider || null,
          data.technicianName || null,
          data.scheduledDate || new Date(),
          data.reason,
          userId
        ]
      );
      maintenance = await repo.findById(repo.tables.maintenance, tenantId, result.insertId, connection);
      if (equipmentData.operational_status !== "maintenance") {
        await repo.update(repo.tables.equipment, tenantId, equipmentData.id, { operationalStatus: "maintenance" }, userId, connection);
        await connection.execute(
          `INSERT INTO equipment_status_history (tenant_id, equipment_id, previous_status, new_status, reason, changed_by)
          VALUES (?, ?, ?, 'maintenance', ?, ?)`,
          [tenantId, equipmentData.id, equipmentData.operational_status, data.reason, userId]
        );
      }
    }

    if (oldBay.operational_status !== "maintenance") {
      await repo.update(table, tenantId, id, { operationalStatus: "maintenance" }, userId, connection);
      await connection.execute(
        `INSERT INTO bay_status_history (tenant_id, bay_id, previous_status, new_status, reason, changed_by)
        VALUES (?, ?, ?, 'maintenance', ?, ?)`,
        [tenantId, id, oldBay.operational_status, data.reason, userId]
      );
    }

    const newBay = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, {
      tenantId,
      userId,
      action: maintenance ? "workshop_bay.maintenance.create" : "workshop_bay.maintenance.block",
      entity: table,
      entityId: id,
      oldData: oldBay,
      newData: { bay: newBay, maintenance },
      ipAddress
    });
    await connection.commit();
    return { bay: newBay, maintenance };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function release({ tenantId, id, userId, ipAddress, data }) {
  const newStatus = data.operationalStatus || "available";
  if (!["available", "unavailable"].includes(newStatus)) throw new AppError("Estado de liberacao invalido", 400);
  if (!data.reason) throw new AppError("O motivo e obrigatorio", 400);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldBay = await repo.findById(table, tenantId, id, connection);
    if (!oldBay) throw new AppError("Baia nao encontrada", 404);
    if (oldBay.operational_status === newStatus) throw new AppError("A situacao selecionada ja e a situacao atual.", 400);

    if (data.releaseEquipment) {
      const equipment = await listBayEquipment(connection, tenantId, id);
      for (const item of equipment.filter((eq) => eq.operational_status === "maintenance")) {
        const active = await repo.count(repo.tables.maintenance, tenantId, "equipment_id", item.id, connection, "AND status IN ('scheduled', 'in_progress')");
        if (active > 0) throw new AppError("Existe manutencao agendada ou em andamento para equipamento desta baia. Conclua ou cancele antes de liberar.", 400);
        await repo.update(repo.tables.equipment, tenantId, item.id, { operationalStatus: newStatus }, userId, connection);
        await connection.execute(
          `INSERT INTO equipment_status_history (tenant_id, equipment_id, previous_status, new_status, reason, changed_by)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [tenantId, item.id, item.operational_status, newStatus, data.reason, userId]
        );
      }
    }

    await repo.update(table, tenantId, id, { operationalStatus: newStatus }, userId, connection);
    await connection.execute(
      `INSERT INTO bay_status_history (tenant_id, bay_id, previous_status, new_status, reason, changed_by)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, id, oldBay.operational_status, newStatus, data.reason, userId]
    );
    const newBay = await repo.findById(table, tenantId, id, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "workshop_bay.release", entity: table, entityId: id, oldData: oldBay, newData: newBay, ipAddress });
    await connection.commit();
    return newBay;
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
  createMaintenance,
  release,
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
