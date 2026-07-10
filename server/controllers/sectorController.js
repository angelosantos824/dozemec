const sectorService = require("../services/sectorService");
const apiResponse = require("../utils/apiResponse");

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list: wrap(async (req, res) => apiResponse.success(res, await sectorService.list(req.user.tenantId, req.query))),
  show: wrap(async (req, res) => apiResponse.success(res, await sectorService.get(req.user.tenantId, req.params.id))),
  create: wrap(async (req, res) =>
    apiResponse.success(res, await sectorService.create({ tenantId: req.user.tenantId, userId: req.user.id, ipAddress: req.ip, data: req.body }), 201)
  ),
  update: wrap(async (req, res) =>
    apiResponse.success(res, await sectorService.update({ tenantId: req.user.tenantId, id: req.params.id, userId: req.user.id, ipAddress: req.ip, data: req.body }))
  ),
  remove: wrap(async (req, res) =>
    apiResponse.success(res, await sectorService.remove({ tenantId: req.user.tenantId, id: req.params.id, userId: req.user.id, ipAddress: req.ip }))
  )
};
