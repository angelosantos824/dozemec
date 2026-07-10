const auditLogService = require("../services/auditLogService");
const apiResponse = require("../utils/apiResponse");

async function list(req, res, next) {
  try {
    return apiResponse.success(res, await auditLogService.list(req.user.tenantId, req.query));
  } catch (error) {
    return next(error);
  }
}

module.exports = { list };
