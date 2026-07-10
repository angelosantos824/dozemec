const permissionService = require("../services/permissionService");
const apiResponse = require("../utils/apiResponse");

async function list(req, res, next) {
  try {
    return apiResponse.success(res, await permissionService.listGrouped());
  } catch (error) {
    return next(error);
  }
}

module.exports = { list };
