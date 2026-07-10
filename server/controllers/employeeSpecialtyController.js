const service = require("../services/employeeSpecialtyService");
const apiResponse = require("../utils/apiResponse");

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list: wrap(async (req, res) => apiResponse.success(res, await service.list(req.user.tenantId, req.query))),
  show: wrap(async (req, res) => apiResponse.success(res, await service.get(req.user.tenantId, req.params.id))),
  create: wrap(async (req, res) => apiResponse.success(res, await service.create({ tenantId: req.user.tenantId, userId: req.user.id, ipAddress: req.ip, data: req.body }), 201)),
  update: wrap(async (req, res) => apiResponse.success(res, await service.update({ tenantId: req.user.tenantId, id: req.params.id, userId: req.user.id, ipAddress: req.ip, data: req.body }))),
  remove: wrap(async (req, res) => apiResponse.success(res, await service.remove({ tenantId: req.user.tenantId, id: req.params.id, userId: req.user.id, ipAddress: req.ip })))
};
