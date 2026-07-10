const userService = require("../services/userService");
const apiResponse = require("../utils/apiResponse");

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list: wrap(async (req, res) => apiResponse.success(res, await userService.list(req.user.tenantId, req.query))),
  show: wrap(async (req, res) => apiResponse.success(res, await userService.get(req.user.tenantId, req.params.id))),
  create: wrap(async (req, res) =>
    apiResponse.success(
      res,
      await userService.create({ tenantId: req.user.tenantId, userId: req.user.id, ipAddress: req.ip, data: req.body }),
      201
    )
  ),
  update: wrap(async (req, res) =>
    apiResponse.success(
      res,
      await userService.update({ tenantId: req.user.tenantId, targetId: req.params.id, userId: req.user.id, ipAddress: req.ip, data: req.body })
    )
  ),
  block: wrap(async (req, res) =>
    apiResponse.success(
      res,
      await userService.block({ tenantId: req.user.tenantId, targetId: req.params.id, userId: req.user.id, ipAddress: req.ip, reason: req.body.reason })
    )
  ),
  activate: wrap(async (req, res) =>
    apiResponse.success(res, await userService.activate({ tenantId: req.user.tenantId, targetId: req.params.id, userId: req.user.id, ipAddress: req.ip }))
  ),
  deactivate: wrap(async (req, res) =>
    apiResponse.success(res, await userService.deactivate({ tenantId: req.user.tenantId, targetId: req.params.id, userId: req.user.id, ipAddress: req.ip }))
  ),
  resetPassword: wrap(async (req, res) =>
    apiResponse.success(
      res,
      await userService.resetPassword({ tenantId: req.user.tenantId, targetId: req.params.id, userId: req.user.id, ipAddress: req.ip, temporaryPassword: req.body.temporaryPassword })
    )
  ),
  remove: wrap(async (req, res) =>
    apiResponse.success(res, await userService.remove({ tenantId: req.user.tenantId, targetId: req.params.id, userId: req.user.id, ipAddress: req.ip }))
  ),
  loginHistory: wrap(async (req, res) =>
    apiResponse.success(res, await userService.loginHistory(req.user.tenantId, req.params.id, req.query))
  )
};
