const service = require("../services/workshopMapService");
const apiResponse = require("../utils/apiResponse");
async function show(req, res, next) {
  try { return apiResponse.success(res, await service.getMap(req.user.tenantId)); }
  catch (error) { return next(error); }
}
module.exports = { show };
