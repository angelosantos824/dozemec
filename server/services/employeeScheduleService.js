const pool = require("../config/database");
const auditRepository = require("../repositories/auditRepository");
const employeeRepository = require("../repositories/employeeRepository");
const employeeService = require("./employeeService");
const validators = require("../validators/employeeValidators");

async function get({ tenantId, employeeId }) {
  await employeeService.requireEmployee(tenantId, employeeId);
  return { days: await employeeRepository.listSchedule(tenantId, employeeId) };
}

async function update({ tenantId, employeeId, userId, ipAddress, data }) {
  validators.schedule(data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await employeeService.requireEmployee(tenantId, employeeId, connection);
    const oldData = await employeeRepository.listSchedule(tenantId, employeeId, connection);
    await employeeRepository.upsertSchedule(tenantId, employeeId, data.days, connection);
    const newData = await employeeRepository.listSchedule(tenantId, employeeId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "employee.schedule.update", entity: "employees", entityId: employeeId, oldData: { days: oldData.length }, newData: { days: newData.length }, ipAddress });
    await connection.commit();
    return { days: newData };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { get, update };
