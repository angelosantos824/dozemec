const pool = require("../config/database");
const auditRepository = require("../repositories/auditRepository");
const settingsRepository = require("../repositories/companySettingsRepository");
const {
  integrationTypes,
  validateBusinessHours,
  validateIntegration,
  validateSettingsUpdate
} = require("../validators/companySettingsValidator");

async function getSettings(tenantId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await settingsRepository.ensureSettings(tenantId, connection);
    const settings = await settingsRepository.findSettings(tenantId, connection);
    await connection.commit();
    return settings;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateSettings({ tenantId, userId, ipAddress, data }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await settingsRepository.ensureSettings(tenantId, connection);
    const oldData = await settingsRepository.findSettings(tenantId, connection);
    validateSettingsUpdate(data, oldData);
    await settingsRepository.updateSettings(tenantId, data, connection);
    const newData = await settingsRepository.findSettings(tenantId, connection);
    await auditRepository.create(connection, {
      tenantId,
      userId,
      action: "company_settings.update",
      entity: "tenant_settings",
      entityId: newData.id,
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

async function getBusinessHours(tenantId) {
  return settingsRepository.findBusinessHours(tenantId);
}

async function updateBusinessHours({ tenantId, userId, ipAddress, days }) {
  validateBusinessHours(days);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await settingsRepository.findBusinessHours(tenantId, connection);
    for (const day of days) {
      await settingsRepository.upsertBusinessHour(tenantId, day, connection);
    }
    const newData = await settingsRepository.findBusinessHours(tenantId, connection);
    await auditRepository.create(connection, {
      tenantId,
      userId,
      action: "business_hours.update",
      entity: "tenant_business_hours",
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

async function getIntegrations(tenantId) {
  return settingsRepository.findIntegrations(tenantId);
}

async function updateIntegration({ tenantId, userId, ipAddress, integrationType, data }) {
  validateIntegration(integrationType, data);
  const provider = data.provider || "default";
  const status = data.status || "inactive";
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await settingsRepository.findIntegration(tenantId, integrationType, provider, connection);
    await settingsRepository.upsertIntegration(tenantId, integrationType, provider, status, connection);
    const newData = await settingsRepository.findIntegration(tenantId, integrationType, provider, connection);
    await auditRepository.create(connection, {
      tenantId,
      userId,
      action: "integration.update",
      entity: "tenant_integrations",
      entityId: newData.id,
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
  integrationTypes,
  getSettings,
  updateSettings,
  getBusinessHours,
  updateBusinessHours,
  getIntegrations,
  updateIntegration
};
