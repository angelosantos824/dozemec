const service = require("../services/employeeScheduleService");
const apiResponse = require("../utils/apiResponse");

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  show: wrap(async (req, res) => apiResponse.success(res, await service.get({ tenantId: req.user.tenantId, employeeId: req.params.id }))),
  update: wrap(async (req, res) => apiResponse.success(res, await service.update({ tenantId: req.user.tenantId, employeeId: req.params.id, userId: req.user.id, ipAddress: req.ip, data: req.body })))
};
