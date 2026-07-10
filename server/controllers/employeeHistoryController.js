const service = require("../services/employeeHistoryService");
const apiResponse = require("../utils/apiResponse");

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list: wrap(async (req, res) => apiResponse.success(res, await service.list({ tenantId: req.user.tenantId, employeeId: req.params.id }))),
  summary: wrap(async (req, res) => apiResponse.success(res, await service.summary({ tenantId: req.user.tenantId, employeeId: req.params.id, requester: req.user })))
};
