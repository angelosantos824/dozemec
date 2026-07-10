const pool = require("../config/database");
const AppError = require("../utils/AppError");
const auditRepository = require("../repositories/auditRepository");
const companyRepository = require("../repositories/companyRepository");
const { validateCompanyUpdate, validateBrandingUpdate } = require("../validators/companyValidator");

async function getCompany(tenantId) {
  const company = await companyRepository.findByTenantId(tenantId);
  if (!company) throw new AppError("Empresa nao encontrada", 404);
  return company;
}

async function updateCompany({ tenantId, userId, ipAddress, data }) {
  validateCompanyUpdate(data);
  return updateTenantData({ tenantId, userId, ipAddress, data, action: "company.update", entity: "tenants" });
}

async function getBranding(tenantId) {
  const company = await getCompany(tenantId);
  return {
    logoUrl: company.logoUrl,
    faviconUrl: company.faviconUrl,
    loginImageUrl: company.loginImageUrl,
    dashboardImageUrl: company.dashboardImageUrl,
    primaryColor: company.primaryColor,
    secondaryColor: company.secondaryColor,
    accentColor: company.accentColor,
    theme: company.theme
  };
}

async function updateBranding({ tenantId, userId, ipAddress, data }) {
  validateBrandingUpdate(data);
  return updateTenantData({
    tenantId,
    userId,
    ipAddress,
    data,
    action: "company_branding.update",
    entity: "tenant_branding"
  });
}

async function updateTenantData({ tenantId, userId, ipAddress, data, action, entity }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await companyRepository.findByTenantId(tenantId, connection);
    if (!oldData) throw new AppError("Empresa nao encontrada", 404);

    await companyRepository.update(tenantId, data, connection);
    const newData = await companyRepository.findByTenantId(tenantId, connection);
    await auditRepository.create(connection, {
      tenantId,
      userId,
      action,
      entity,
      entityId: tenantId,
      oldData,
      newData,
      ipAddress
    });

    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getCompany,
  updateCompany,
  getBranding,
  updateBranding
};
