const AppError = require("../utils/AppError");

const enums = {
  customerType: ["individual", "company"],
  gender: ["male", "female", "other", "not_informed"],
  preferredContactMethod: ["phone", "whatsapp", "email", "sms", "none"],
  status: ["active", "inactive"],
  contactType: ["personal", "commercial", "administrative", "financial", "billing", "technical", "emergency", "other"],
  addressType: ["residential", "commercial", "billing", "service", "correspondence", "other"],
  documentType: ["identity", "tax", "driver_license", "company_registration", "insurance", "contract", "authorization", "other"],
  documentStatus: ["valid", "expired", "pending", "cancelled"],
  consentType: ["privacy_policy", "marketing_email", "marketing_sms", "marketing_whatsapp", "service_reminders", "data_processing", "third_party_sharing", "other"],
  consentSource: ["manual", "paper", "email", "website", "phone", "other"],
  noteType: ["general", "commercial", "financial", "service", "complaint", "preference", "other"],
  relationshipType: ["company_contact", "family", "fleet_manager", "billing_responsible", "legal_representative", "partner", "other"],
  invoiceDeliveryMethod: ["email", "paper", "portal", "none"]
};

function fail(message) {
  throw new AppError(message, 400);
}

function assertNoTenant(data) {
  if (!data) return;
  if (Object.prototype.hasOwnProperty.call(data, "tenant_id") || Object.prototype.hasOwnProperty.call(data, "tenantId")) fail("tenant_id nao pode ser enviado");
}

function assertEnum(value, field, allowed) {
  if (value === undefined || value === null || value === "") return;
  if (!allowed.includes(value)) fail(`${field} invalido`);
}

function assertText(value, field, required = false, max = 180) {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} e obrigatorio`);
    return;
  }
  if (String(value).trim().length > max) fail(`${field} excede o tamanho permitido`);
}

function assertNumber(value, field, min = 0) {
  if (value === undefined || value === null || value === "") return;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min) fail(`${field} invalido`);
}

function assertDate(value, field) {
  if (!value) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(value))) fail(`${field} deve ser uma data valida`);
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

function normalizeEmail(value) {
  return value ? String(value).trim().toLowerCase() : null;
}

function customer(data, update = false) {
  assertNoTenant(data);
  assertEnum(data.customerType, "Tipo de cliente", enums.customerType);
  assertText(data.customerCode, "Codigo do cliente", !update, 80);
  const type = data.customerType;
  if (!update && type === "individual") assertText(data.fullName, "Nome completo", true, 150);
  if (!update && type === "company") assertText(data.legalName, "Razao social", true, 180);
  if (type === "individual") {
    if (data.stateRegistration || data.municipalRegistration) fail("Inscricoes sao exclusivas de empresa");
  }
  if (type === "company") {
    if (data.identityDocument || data.birthDate || (data.gender && data.gender !== "not_informed")) fail("Dados pessoais sao exclusivos de cliente particular");
  }
  assertEnum(data.gender, "Genero", enums.gender);
  assertEnum(data.preferredContactMethod, "Metodo preferido", enums.preferredContactMethod);
  assertEnum(data.status, "Status", enums.status);
  assertDate(data.birthDate, "Data de nascimento");
  assertUrl(data.website, "Website");
  assertNumber(data.creditLimit, "Limite de credito");
  assertNumber(data.paymentTermsDays, "Prazo de pagamento");
  if (data.isBlocked && !data.blockReason) fail("Motivo de bloqueio e obrigatorio");
  if (data.email) data.email = normalizeEmail(data.email);
}

function contact(data, update = false) {
  assertNoTenant(data);
  assertEnum(data.contactType, "Tipo de contato", enums.contactType);
  assertText(data.name, "Nome do contato", !update, 150);
  assertEnum(data.status, "Status", enums.status);
  if (data.email) data.email = normalizeEmail(data.email);
}

function address(data, update = false) {
  assertNoTenant(data);
  assertEnum(data.addressType, "Tipo de endereco", enums.addressType);
  assertText(data.address, "Endereco", !update, 180);
  assertEnum(data.status, "Status", enums.status);
  assertNumber(data.latitude, "Latitude", -90);
  assertNumber(data.longitude, "Longitude", -180);
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

function consent(data) {
  assertNoTenant(data);
  assertEnum(data.source, "Origem", enums.consentSource);
}

function preferences(data) {
  assertNoTenant(data);
  assertEnum(data.preferredContactMethod, "Metodo preferido", enums.preferredContactMethod);
  assertEnum(data.invoiceDeliveryMethod, "Entrega de fatura", enums.invoiceDeliveryMethod);
}

function note(data, update = false) {
  assertNoTenant(data);
  assertEnum(data.noteType, "Tipo de nota", enums.noteType);
  assertText(data.content, "Conteudo", !update, 5000);
}

function relationship(data) {
  assertNoTenant(data);
  assertNumber(data.relatedCustomerId, "Cliente relacionado", 1);
  assertEnum(data.relationshipType, "Tipo de relacao", enums.relationshipType);
}

module.exports = { enums, customer, contact, address, document, consent, preferences, note, relationship, normalizeEmail };
