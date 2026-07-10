const companySettingsService = require("../services/companySettingsService");
const apiResponse = require("../utils/apiResponse");

async function show(req, res, next) {
  try {
    const data = await companySettingsService.getSettings(req.user.tenantId);
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await companySettingsService.updateSettings({
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

async function businessHours(req, res, next) {
  try {
    const data = await companySettingsService.getBusinessHours(req.user.tenantId);
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

async function updateBusinessHours(req, res, next) {
  try {
    const data = await companySettingsService.updateBusinessHours({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      ipAddress: req.ip,
      days: req.body.days
    });
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

async function integrations(req, res, next) {
  try {
    const data = await companySettingsService.getIntegrations(req.user.tenantId);
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

async function updateIntegration(req, res, next) {
  try {
    const data = await companySettingsService.updateIntegration({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      ipAddress: req.ip,
      integrationType: req.params.integrationType,
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
  businessHours,
  updateBusinessHours,
  integrations,
  updateIntegration
};
