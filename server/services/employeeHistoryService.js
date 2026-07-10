const employeeRepository = require("../repositories/employeeRepository");
const employeeService = require("./employeeService");

async function list({ tenantId, employeeId }) {
  await employeeService.requireEmployee(tenantId, employeeId);
  return { items: await employeeRepository.listHistory(tenantId, employeeId) };
}

async function summary({ tenantId, employeeId, requester }) {
  const employee = await employeeService.get({ tenantId, id: employeeId, requester });
  const [schedule, documentSummary] = await Promise.all([
    employeeRepository.listSchedule(tenantId, employeeId),
    employeeRepository.documentSummary(tenantId, employeeId)
  ]);
  return {
    employee,
    scheduleSummary: schedule,
    documentsTotal: documentSummary.total,
    documentsExpiringSoon: documentSummary.expiringSoon
  };
}

module.exports = { list, summary };
