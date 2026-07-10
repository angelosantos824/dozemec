const AppError = require("../utils/AppError");

const enums = {
  gender: ["male", "female", "other", "not_informed"],
  employmentType: ["employee", "contractor", "temporary", "intern", "partner", "other"],
  contractStatus: ["active", "probation", "on_leave", "suspended", "terminated"],
  status: ["active", "inactive"],
  documentType: ["identity", "tax", "driver_license", "work_authorization", "professional_certificate", "safety_training", "medical_certificate", "contract", "other"],
  documentStatus: ["valid", "expired", "pending", "cancelled"],
  noteType: ["general", "performance", "training", "administrative", "disciplinary", "other"]
};

function fail(message) {
  throw new AppError(message, 400);
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
}

function normalizeEmail(value) {
  return value ? String(value).trim().toLowerCase() : null;
}

function nullable(value) {
  return value === undefined || value === "" ? null : value;
}

function assertNoTenant(data) {
  if (data && Object.prototype.hasOwnProperty.call(data, "tenant_id")) fail("tenant_id nao pode ser enviado");
  if (data && Object.prototype.hasOwnProperty.call(data, "tenantId")) fail("tenantId nao pode ser enviado");
}

function assertText(value, field, required = false, max = 150) {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} e obrigatorio`);
    return;
  }
  if (String(value).trim().length > max) fail(`${field} excede o tamanho permitido`);
}

function assertNumber(value, field, { min, max } = {}) {
  if (value === undefined || value === null || value === "") return;
  const number = Number(value);
  if (!Number.isFinite(number)) fail(`${field} deve ser numerico`);
  if (min !== undefined && number < min) fail(`${field} nao pode ser menor que ${min}`);
  if (max !== undefined && number > max) fail(`${field} nao pode ser maior que ${max}`);
}

function assertEnum(value, field, allowed) {
  if (value === undefined || value === null || value === "") return;
  if (!allowed.includes(value)) fail(`${field} invalido`);
}

function assertUrl(value, field) {
  if (!value) return;
  try {
    const parsed = new URL(String(value));
    if (!["http:", "https:"].includes(parsed.protocol)) fail(`${field} deve ser URL http ou https`);
  } catch {
    fail(`${field} deve ser uma URL valida`);
  }
}

function assertDate(value, field) {
  if (!value) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(value))) fail(`${field} deve ser uma data valida`);
}

function catalog(data, update = false) {
  assertNoTenant(data);
  assertText(data.name, "Nome", !update, 120);
  assertText(data.code, "Codigo", !update, 80);
  assertText(data.description, "Descricao", false, 2000);
  assertNumber(data.defaultCommissionPercentage, "Comissao padrao", { min: 0, max: 100 });
  assertEnum(data.status, "Status", enums.status);
  assertNumber(data.displayOrder, "Ordem", { min: 0 });
  if (data.code !== undefined) data.code = normalizeCode(data.code);
}

function employee(data, update = false) {
  assertNoTenant(data);
  assertText(data.employeeNumber, "Numero do funcionario", !update, 80);
  assertText(data.fullName, "Nome completo", !update, 150);
  assertText(data.email, "E-mail", false, 150);
  assertDate(data.birthDate, "Data de nascimento");
  assertDate(data.hireDate, "Data de admissao");
  assertDate(data.terminationDate, "Data de encerramento");
  if (!update && !data.hireDate) fail("Data de admissao e obrigatoria");
  assertEnum(data.gender, "Genero", enums.gender);
  assertEnum(data.employmentType, "Tipo de contratacao", enums.employmentType);
  assertEnum(data.contractStatus, "Situacao contratual", enums.contractStatus);
  assertEnum(data.status, "Status", enums.status);
  assertNumber(data.baseSalary, "Salario base", { min: 0 });
  assertNumber(data.hourlyRate, "Valor hora", { min: 0 });
  assertNumber(data.commissionPercentage, "Comissao", { min: 0, max: 100 });
  assertUrl(data.photoUrl, "Foto");
  if (data.email) data.email = normalizeEmail(data.email);
  if ((data.contractStatus === "terminated" || data.terminationDate) && !data.terminationDate) fail("Data de encerramento e obrigatoria para contrato encerrado");
  if (data.contractStatus && data.contractStatus !== "terminated" && data.terminationDate) fail("Data de encerramento so pode existir para contrato encerrado");
  if (data.hireDate && data.terminationDate && new Date(data.terminationDate) < new Date(data.hireDate)) fail("Data de encerramento nao pode ser anterior a admissao");
  if (data.specialtyIds && !Array.isArray(data.specialtyIds)) fail("Especialidades devem ser uma lista");
}

function schedule(data) {
  assertNoTenant(data);
  if (!Array.isArray(data.days) || data.days.length === 0) fail("Informe os dias de horario");
  const seen = new Set();
  data.days.forEach((day) => {
    assertNumber(day.dayOfWeek, "Dia da semana", { min: 0, max: 6 });
    if (seen.has(Number(day.dayOfWeek))) fail("Dias duplicados no horario");
    seen.add(Number(day.dayOfWeek));
    if (day.isWorkingDay === false) return;
    if (!day.startTime || !day.endTime) fail("Inicio e fim sao obrigatorios em dia trabalhado");
    if (day.startTime >= day.endTime) fail("Horario inicial deve ser menor que horario final");
    if ((day.lunchStartTime && !day.lunchEndTime) || (!day.lunchStartTime && day.lunchEndTime)) fail("Intervalo de almoco incompleto");
    if (day.lunchStartTime && (day.lunchStartTime >= day.lunchEndTime || day.lunchStartTime < day.startTime || day.lunchEndTime > day.endTime)) fail("Intervalo de almoco fora da jornada");
  });
}

function document(data, update = false) {
  assertNoTenant(data);
  assertEnum(data.documentType, "Tipo de documento", enums.documentType);
  assertText(data.documentNumber, "Numero do documento", !update, 120);
  assertDate(data.issueDate, "Data de emissao");
  assertDate(data.expiryDate, "Data de validade");
  assertUrl(data.fileUrl, "Arquivo");
  assertEnum(data.status, "Status", enums.documentStatus);
  if (data.issueDate && data.expiryDate && new Date(data.expiryDate) < new Date(data.issueDate)) fail("Validade nao pode ser anterior a emissao");
}

function note(data, update = false) {
  assertNoTenant(data);
  assertEnum(data.noteType, "Tipo de nota", enums.noteType);
  assertText(data.content, "Conteudo", !update, 5000);
}

module.exports = {
  enums,
  nullable,
  normalizeCode,
  normalizeEmail,
  catalog,
  employee,
  schedule,
  document,
  note
};
