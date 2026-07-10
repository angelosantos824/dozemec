const AppError = require("../utils/AppError");
const crud = require("./workshopCrudService");
const repo = require("../repositories/workshopRepository");
const { validateEquipmentType } = require("../validators/workshopValidators");

const table = repo.tables.equipmentTypes;
const sortFields = { name: "name", code: "code", status: "status", displayOrder: "display_order", createdAt: "created_at" };

module.exports = {
  list: (tenantId, query) => crud.list({ table, tenantId, query, sortFields }),
  get: (tenantId, id) => crud.get({ table, tenantId, id }),
  create: (ctx) => crud.create({ ...ctx, table, validate: validateEquipmentType, auditAction: "equipment_type.create", entity: table }),
  update: (ctx) => crud.update({ ...ctx, table, validate: validateEquipmentType, auditAction: "equipment_type.update", entity: table }),
  remove: (ctx) => crud.remove({
    ...ctx,
    table,
    auditAction: "equipment_type.delete",
    entity: table,
    beforeDelete: async (connection, type) => {
      const total = await repo.count(repo.tables.equipment, ctx.tenantId, "equipment_type_id", type.id, connection, "AND status = 'active'");
      if (total > 0) throw new AppError("Nao e possivel excluir tipo com equipamentos ativos", 400);
    }
  })
};
