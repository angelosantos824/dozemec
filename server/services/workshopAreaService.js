const AppError = require("../utils/AppError");
const crud = require("./workshopCrudService");
const repo = require("../repositories/workshopRepository");
const { validateArea } = require("../validators/workshopValidators");

const table = repo.tables.areas;
const sortFields = { name: "name", code: "code", status: "status", displayOrder: "display_order", createdAt: "created_at" };

module.exports = {
  list: (tenantId, query) => crud.list({ table, tenantId, query, sortFields }),
  get: (tenantId, id) => crud.get({ table, tenantId, id }),
  create: (ctx) => crud.create({ ...ctx, table, validate: validateArea, auditAction: "workshop_area.create", entity: table }),
  update: (ctx) => crud.update({ ...ctx, table, validate: validateArea, auditAction: "workshop_area.update", entity: table }),
  remove: (ctx) => crud.remove({
    ...ctx,
    table,
    auditAction: "workshop_area.delete",
    entity: table,
    beforeDelete: async (connection, area) => {
      const total = await repo.count(repo.tables.bays, ctx.tenantId, "area_id", area.id, connection, "AND status = 'active'");
      if (total > 0) throw new AppError("Nao e possivel excluir area com baias ativas vinculadas", 400);
    }
  })
};
