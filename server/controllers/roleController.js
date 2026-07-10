const roleService = require("../services/roleService");
const apiResponse = require("../utils/apiResponse");

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list: wrap(async (req, res) => apiResponse.success(res, await roleService.list(req.user.tenantId, req.query))),
  show: wrap(async (req, res) => apiResponse.success(res, await roleService.get(req.user.tenantId, req.params.id))),
  create: wrap(async (req, res) =>
    apiResponse.success(res, await roleService.create({ tenantId: req.user.tenantId, userId: req.user.id, ipAddress: req.ip, data: req.body }), 201)
  ),
  update: wrap(async (req, res) =>
    apiResponse.success(res, await roleService.update({ tenantId: req.user.tenantId, id: req.params.id, userId: req.user.id, ipAddress: req.ip, data: req.body }))
  ),
  updatePermissions: wrap(async (req, res) =>
    apiResponse.success(res, await roleService.updatePermissions({ tenantId: req.user.tenantId, id: req.params.id, userId: req.user.id, ipAddress: req.ip, permissionIds: req.body.permissionIds }))
  ),
  remove: wrap(async (req, res) =>
    apiResponse.success(res, await roleService.remove({ tenantId: req.user.tenantId, id: req.params.id, userId: req.user.id, ipAddress: req.ip }))
  )
};
