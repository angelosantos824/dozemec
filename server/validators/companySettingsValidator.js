const AppError = require("../utils/AppError");
const {
  assertAllowedFields,
  assertPercentage,
  isTime,
  timeToMinutes
} = require("./commonValidators");

const settingsFields = [
  "worksSaturday",
  "worksSunday",
  "openingTime",
  "closingTime",
  "lunchStartTime",
  "lunchEndTime",
  "defaultServiceDurationMinutes",
  "appointmentIntervalMinutes",
  "workOrderPrefix",
  "workOrderNextNumber",
  "workOrderNumberPadding",
  "automaticWorkOrderNumber",
  "defaultTaxPercentage",
  "defaultEmployeeCommissionPercentage",
  "defaultPartsMarginPercentage",
  "defaultServicesMarginPercentage",
  "allowNegativeStock",
  "requireCustomerApproval",
  "requireVehiclePhotos",
  "requireChecklist",
  "documentHeaderText",
  "documentFooterText",
  "documentTerms"
];

const integrationTypes = [
  "whatsapp",
  "email",
  "sms",
  "payments",
  "fiscal",
  "parts_catalog",
  "artificial_intelligence"
];

function validateSettingsUpdate(body, currentSettings) {
  assertAllowedFields(body, settingsFields);

  if (body.workOrderPrefix !== undefined && String(body.workOrderPrefix).length > 10) {
    throw new AppError("O prefixo da OS deve possuir no maximo 10 caracteres", 400);
  }
  if (body.workOrderNumberPadding !== undefined) {
    const padding = Number(body.workOrderNumberPadding);
    if (!Number.isInteger(padding) || padding < 3 || padding > 12) {
      throw new AppError("A quantidade de digitos da OS deve estar entre 3 e 12", 400);
    }
  }
  if (body.workOrderNextNumber !== undefined) {
    const nextNumber = Number(body.workOrderNextNumber);
    if (!Number.isInteger(nextNumber) || nextNumber < 1) {
      throw new AppError("O proximo numero da OS deve ser maior que zero", 400);
    }
    if (currentSettings && nextNumber < Number(currentSettings.workOrderNextNumber)) {
      throw new AppError("O proximo numero da OS nao pode ser reduzido", 400);
    }
  }

  const positiveFields = ["defaultServiceDurationMinutes", "appointmentIntervalMinutes"];
  for (const field of positiveFields) {
    if (body[field] !== undefined && (!Number.isInteger(Number(body[field])) || Number(body[field]) <= 0)) {
      throw new AppError("Tempos devem ser maiores que zero", 400);
    }
  }

  assertPercentage(body.defaultTaxPercentage, "O imposto padrao deve estar entre 0 e 100");
  assertPercentage(
    body.defaultEmployeeCommissionPercentage,
    "A comissao padrao deve estar entre 0 e 100"
  );
  assertPercentage(body.defaultPartsMarginPercentage, "A margem de pecas deve estar entre 0 e 100");
  assertPercentage(body.defaultServicesMarginPercentage, "A margem de servicos deve estar entre 0 e 100");

  validateTimeRange(body.openingTime, body.closingTime, body.lunchStartTime, body.lunchEndTime);
}

function validateTimeRange(openingTime, closingTime, lunchStartTime, lunchEndTime) {
  for (const time of [openingTime, closingTime, lunchStartTime, lunchEndTime]) {
    if (!isTime(time)) throw new AppError("Horario invalido", 400);
  }

  const opening = timeToMinutes(openingTime);
  const closing = timeToMinutes(closingTime);
  const lunchStart = timeToMinutes(lunchStartTime);
  const lunchEnd = timeToMinutes(lunchEndTime);

  if (opening !== null && closing !== null && opening >= closing) {
    throw new AppError("A abertura deve ser menor que o fechamento", 400);
  }
  if ((lunchStart !== null && lunchEnd === null) || (lunchStart === null && lunchEnd !== null)) {
    throw new AppError("Informe inicio e fim do almoco", 400);
  }
  if (lunchStart !== null && lunchEnd !== null) {
    if (lunchStart >= lunchEnd) throw new AppError("O inicio do almoco deve ser menor que o fim", 400);
    if (opening !== null && lunchStart < opening) throw new AppError("O almoco deve estar dentro do horario", 400);
    if (closing !== null && lunchEnd > closing) throw new AppError("O almoco deve estar dentro do horario", 400);
  }
}

function validateBusinessHours(days) {
  if (!Array.isArray(days)) throw new AppError("Informe a lista de dias", 400);

  const seen = new Set();
  for (const day of days) {
    const dayOfWeek = Number(day.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new AppError("O dia da semana deve estar entre 0 e 6", 400);
    }
    if (seen.has(dayOfWeek)) throw new AppError("Nao informe dias duplicados", 400);
    seen.add(dayOfWeek);

    if (day.isOpen) {
      validateTimeRange(day.openingTime, day.closingTime, day.lunchStartTime, day.lunchEndTime);
      if (!day.openingTime || !day.closingTime) {
        throw new AppError("Dias abertos precisam de horario de abertura e fechamento", 400);
      }
    } else {
      for (const field of ["openingTime", "closingTime", "lunchStartTime", "lunchEndTime"]) {
        if (day[field] !== null && day[field] !== undefined && !isTime(day[field])) {
          throw new AppError("Horario invalido", 400);
        }
      }
    }
  }
}

function validateIntegration(integrationType, body) {
  assertAllowedFields(body, ["provider", "status"]);
  if (!integrationTypes.includes(integrationType)) {
    throw new AppError("Tipo de integracao invalido", 400);
  }
  if (body.status !== undefined && !["inactive", "active", "error"].includes(body.status)) {
    throw new AppError("Status de integracao invalido", 400);
  }
  if (body.provider !== undefined && !String(body.provider).trim()) {
    throw new AppError("O provedor da integracao nao pode estar vazio", 400);
  }
}

module.exports = {
  integrationTypes,
  validateSettingsUpdate,
  validateBusinessHours,
  validateIntegration
};
