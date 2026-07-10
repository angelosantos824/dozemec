const companyService = require("../services/companyService");
const apiResponse = require("../utils/apiResponse");

async function show(req, res, next) {
  try {
    const data = await companyService.getCompany(req.user.tenantId);
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await companyService.updateCompany({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      ipAddress: req.ip,
      data: req.body
    });
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

async function showBranding(req, res, next) {
  try {
    const data = await companyService.getBranding(req.user.tenantId);
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

async function updateBranding(req, res, next) {
  try {
    const data = await companyService.updateBranding({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      ipAddress: req.ip,
      data: req.body
    });
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  show,
  update,
  showBranding,
  updateBranding
};
