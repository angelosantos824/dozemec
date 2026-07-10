const AppError = require("../utils/AppError");
const { assertAllowedFields, isHexColor } = require("./commonValidators");
const { normalizeCode } = require("./accessValidators");

const bayTypes = ["general", "lift", "alignment", "balancing", "diagnostics", "electrical", "washing", "parking", "other"];
const bayStatuses = ["available", "reserved", "occupied", "maintenance", "unavailable"];
const equipmentStatuses = ["available", "in_use", "maintenance", "unavailable", "retired"];
const maintenanceTypes = ["preventive", "corrective", "inspection", "calibration", "other"];
const maintenanceStatuses = ["scheduled", "in_progress", "completed", "cancelled"];

function requiredNameCode(data) {
  if (!data.name || !String(data.name).trim()) throw new AppError("O nome e obrigatorio", 400);
  data.code = normalizeCode(data.code || data.name);
  if (!data.code) throw new AppError("O codigo e obrigatorio", 400);
}

function validateStatus(value) {
  if (value !== undefined && !["active", "inactive"].includes(value)) throw new AppError("Status invalido", 400);
}

function positiveNumber(value, message, allowNull = true) {
  if ((value === null || value === undefined || value === "") && allowNull) return;
  const number = Number(value);
  if (Number.isNaN(number) || number <= 0) throw new AppError(message, 400);
}

function nonNegativeMoney(value) {
  if (value === null || value === undefined || value === "") return;
  const number = Number(value);
  if (Number.isNaN(number) || number < 0) throw new AppError("O valor monetario nao pode ser negativo", 400);
}

function validateArea(data, partial = false) {
  assertAllowedFields(data, ["name", "code", "description", "displayOrder", "status"]);
  if (!partial) requiredNameCode(data);
  else if (data.code || data.name) data.code = normalizeCode(data.code || data.name);
  validateStatus(data.status);
}

function validateBay(data, partial = false) {
  assertAllowedFields(data, ["areaId", "name", "code", "description", "bayType", "capacity", "status", "operationalStatus", "displayOrder", "color", "notes"]);
  if (!partial) requiredNameCode(data);
  else if (data.code || data.name) data.code = normalizeCode(data.code || data.name);
  if (!partial && !data.areaId) throw new AppError("A area e obrigatoria", 400);
  if (data.bayType !== undefined && !bayTypes.includes(data.bayType)) throw new AppError("Tipo de baia invalido", 400);
  if (data.operationalStatus !== undefined && !bayStatuses.includes(data.operationalStatus)) throw new AppError("Estado operacional da baia invalido", 400);
  if (data.color !== undefined && !isHexColor(data.color)) throw new AppError("A cor deve estar em formato hexadecimal valido", 400);
  positiveNumber(data.capacity, "A capacidade deve ser maior que zero", true);
  validateStatus(data.status);
}

function validateEquipmentType(data, partial = false) {
  assertAllowedFields(data, ["name", "code", "description", "requiresMaintenance", "defaultMaintenanceIntervalDays", "status", "displayOrder"]);
  if (!partial) requiredNameCode(data);
  else if (data.code || data.name) data.code = normalizeCode(data.code || data.name);
  positiveNumber(data.defaultMaintenanceIntervalDays, "O intervalo de manutencao deve ser maior que zero", true);
  validateStatus(data.status);
}

function validateEquipment(data, partial = false) {
  assertAllowedFields(data, ["equipmentTypeId", "bayId", "name", "code", "brand", "model", "serialNumber", "assetNumber", "purchaseDate", "purchaseValue", "warrantyEndDate", "maintenanceIntervalDays", "status", "operationalStatus", "notes"]);
  if (!partial) requiredNameCode(data);
  else if (data.code || data.name) data.code = normalizeCode(data.code || data.name);
  if (!partial && !data.equipmentTypeId) throw new AppError("O tipo de equipamento e obrigatorio", 400);
  if (data.operationalStatus !== undefined && !equipmentStatuses.includes(data.operationalStatus)) throw new AppError("Estado operacional do equipamento invalido", 400);
  positiveNumber(data.maintenanceIntervalDays, "O intervalo de manutencao deve ser maior que zero", true);
  nonNegativeMoney(data.purchaseValue);
  validateStatus(data.status);
}

function validateMaintenance(data, partial = false) {
  assertAllowedFields(data, ["equipmentId", "maintenanceType", "status", "description", "serviceProvider", "technicianName", "scheduledDate", "startedAt", "completedAt", "cost", "notes"]);
  if (!partial && !data.equipmentId) throw new AppError("O equipamento e obrigatorio", 400);
  if (!partial && !data.scheduledDate) throw new AppError("A data agendada e obrigatoria", 400);
  if (data.maintenanceType !== undefined && !maintenanceTypes.includes(data.maintenanceType)) throw new AppError("Tipo de manutencao invalido", 400);
  if (data.status !== undefined && !maintenanceStatuses.includes(data.status)) throw new AppError("Status de manutencao invalido", 400);
  nonNegativeMoney(data.cost);
}

function requireReasonForStatus(status, reason, statuses) {
  if (statuses.includes(status) && !reason) throw new AppError("O motivo e obrigatorio para este estado", 400);
}

module.exports = {
  bayTypes,
  bayStatuses,
  equipmentStatuses,
  maintenanceTypes,
  validateArea,
  validateBay,
  validateEquipmentType,
  validateEquipment,
  validateMaintenance,
  requireReasonForStatus
};
