const pool = require("../config/database");
const AppError = require("../utils/AppError");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");
const permissionRepository = require("../repositories/permissionRepository");
const repo = require("../repositories/customerRepository");
const validators = require("../validators/customerValidators");

const sortFields = { customerCode: "customer_code", displayName: "customer_code", status: "status", createdAt: "created_at" };
const financialKeys = ["creditLimit", "paymentTermsDays", "isBlocked", "blockReason"];
const contactFields = { contactType: "contact_type", name: "name", position: "position", email: "email", phone: "phone", whatsapp: "whatsapp", isPrimary: "is_primary", receivesNotifications: "receives_notifications", notes: "notes", status: "status" };
const addressFields = { addressType: "address_type", label: "label", postalCode: "postal_code", address: "address", addressNumber: "address_number", addressComplement: "address_complement", neighborhood: "neighborhood", city: "city", state: "state", country: "country", isPrimary: "is_primary", isBilling: "is_billing", isServiceLocation: "is_service_location", latitude: "latitude", longitude: "longitude", notes: "notes", status: "status" };
const documentFields = { documentType: "document_type", documentNumber: "document_number", issueDate: "issue_date", expiryDate: "expiry_date", fileUrl: "file_url", notes: "notes", status: "status" };
const noteFields = { noteType: "note_type", content: "content", isConfidential: "is_confidential" };
const relationshipFields = { relatedCustomerId: "related_customer_id", relationshipType: "relationship_type", notes: "notes" };

async function list(tenantId, query) {
  const pagination = parsePagination(query, sortFields, "createdAt");
  const result = await repo.list(tenantId, query, pagination);
  return { items: result.items.map((item) => protectCustomer(item, { detail: false })), pagination: pagination.meta(result.total) };
}

async function get({ tenantId, id, requester }) {
  const access = await accessFor(requester);
  const customer = protectCustomer(await requireCustomer(tenantId, id), { detail: true, access });
  customer.preferences = await repo.getPreferences(tenantId, id);
  if (access.documents) customer.documents = protectDocuments(await repo.listChild("customer_documents", tenantId, id, "created_at DESC"), true);
  if (access.notes) customer.notes = await repo.listChild("customer_notes", tenantId, id, "created_at DESC");
  if (customer.notes && !access.confidentialNotes) customer.notes = customer.notes.filter((note) => !note.isConfidential);
  return customer;
}

async function create({ tenantId, userId, roleId, ipAddress, data }) {
  validators.customer(data);
  await assertFinancialAllowed(tenantId, roleId, data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await validateUnique(tenantId, data, null, connection);
    const id = await repo.create(tenantId, data, userId, connection);
    await repo.createDefaultPreferences(tenantId, id, data, connection);
    if (data.primaryContact) {
      validators.contact(data.primaryContact);
      data.primaryContact.isPrimary = true;
      await repo.insertChild("customer_contacts", tenantId, id, data.primaryContact, contactFields, userId, connection);
    }
    if (data.primaryAddress) {
      validators.address(data.primaryAddress);
      data.primaryAddress.isPrimary = true;
      await repo.insertChild("customer_addresses", tenantId, id, data.primaryAddress, addressFields, userId, connection);
    }
    const created = await repo.findById(tenantId, id, connection);
    await repo.addChangeHistory(tenantId, id, "create", "Cliente criado", protectCustomer(created, { detail: true }), userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "customer.create", entity: "customers", entityId: id, newData: protectCustomer(created, { detail: true }), ipAddress });
    await connection.commit();
    return protectCustomer(created, { detail: true, access: { financial: await hasPermission(tenantId, roleId, "customers.view_financial_data") } });
  } catch (error) {
    await connection.rollback();
    throw friendlyDuplicate(error);
  } finally {
    connection.release();
  }
}

async function update({ tenantId, id, userId, roleId, ipAddress, data }) {
  validators.customer(data, true);
  await assertFinancialAllowed(tenantId, roleId, data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireCustomer(tenantId, id, connection);
    if (data.customerType && data.customerType !== oldData.customerType) throw new AppError("Alteracao de tipo de cliente nao e permitida nesta Sprint", 400);
    await validateUnique(tenantId, data, id, connection);
    await repo.update(tenantId, id, data, userId, connection);
    const newData = await repo.findById(tenantId, id, connection);
    await repo.addChangeHistory(tenantId, id, "update", "Cliente atualizado", diff(oldData, newData), userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "customer.update", entity: "customers", entityId: id, oldData: protectCustomer(oldData, { detail: true }), newData: protectCustomer(newData, { detail: true }), ipAddress });
    await connection.commit();
    return protectCustomer(newData, { detail: true, access: { financial: await hasPermission(tenantId, roleId, "customers.view_financial_data") } });
  } catch (error) {
    await connection.rollback();
    throw friendlyDuplicate(error);
  } finally {
    connection.release();
  }
}

async function activate(params) {
  return statusChange({ ...params, status: "active", action: "customer.activate" });
}

async function deactivate(params) {
  if (!params.data.reason) throw new AppError("Motivo e obrigatorio", 400);
  return statusChange({ ...params, status: "inactive", action: "customer.deactivate", reason: params.data.reason });
}

async function block(params) {
  if (!params.data.reason) throw new AppError("Motivo e obrigatorio", 400);
  return statusChange({ ...params, isBlocked: true, blockReason: params.data.reason, action: "customer.block", reason: params.data.reason });
}

async function unblock(params) {
  return statusChange({ ...params, isBlocked: false, blockReason: null, action: "customer.unblock", reason: params.data.reason || "Desbloqueio" });
}

async function statusChange({ tenantId, id, userId, ipAddress, status, isBlocked, blockReason, action, reason }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireCustomer(tenantId, id, connection);
    const data = {};
    if (status) data.status = status;
    if (isBlocked !== undefined) {
      data.isBlocked = isBlocked;
      data.blockReason = blockReason;
    }
    await repo.update(tenantId, id, data, userId, connection);
    const newData = await repo.findById(tenantId, id, connection);
    await repo.addStatusHistory(tenantId, id, oldData.status, newData.status, oldData.isBlocked, newData.isBlocked, reason, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: "customers", entityId: id, oldData: protectCustomer(oldData, { detail: true }), newData: { ...protectCustomer(newData, { detail: true }), reason }, ipAddress });
    await connection.commit();
    return protectCustomer(newData, { detail: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function remove({ tenantId, id, userId, ipAddress }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const oldData = await requireCustomer(tenantId, id, connection);
    await repo.softDelete(tenantId, id, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "customer.delete", entity: "customers", entityId: id, oldData: protectCustomer(oldData, { detail: true }), newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function childList({ tenantId, customerId, table, order }) {
  await requireCustomer(tenantId, customerId);
  const items = await repo.listChild(table, tenantId, customerId, order);
  return { items: table === "customer_documents" ? protectDocuments(items, true) : items };
}

async function childCreate({ tenantId, customerId, userId, ipAddress, table, fields, validate, action, data }) {
  validate(data);
  await assertChildAllowed(tenantId, arguments[0].roleId, table, data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await requireCustomer(tenantId, customerId, connection);
    if ((table === "customer_contacts" || table === "customer_addresses") && data.isPrimary) await repo.clearPrimary(table, tenantId, customerId, connection);
    const id = await repo.insertChild(table, tenantId, customerId, data, fields, userId, connection);
    const created = await repo.findChild(table, tenantId, customerId, id, connection);
    await repo.addChangeHistory(tenantId, customerId, action, "Registro criado", safeChild(table, created), userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: table, entityId: id, newData: safeChild(table, created), ipAddress });
    await connection.commit();
    return table === "customer_documents" ? protectDocuments([created], true)[0] : created;
  } catch (error) {
    await connection.rollback();
    throw friendlyDuplicate(error);
  } finally {
    connection.release();
  }
}

async function childUpdate({ tenantId, customerId, id, userId, ipAddress, table, fields, validate, action, data }) {
  validate(data, true);
  await assertChildAllowed(tenantId, arguments[0].roleId, table, data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await requireCustomer(tenantId, customerId, connection);
    const oldData = await requireChild(table, tenantId, customerId, id, connection);
    if ((table === "customer_contacts" || table === "customer_addresses") && data.isPrimary) await repo.clearPrimary(table, tenantId, customerId, connection);
    await repo.updateChild(table, tenantId, customerId, id, data, fields, userId, connection);
    const newData = await repo.findChild(table, tenantId, customerId, id, connection);
    await repo.addChangeHistory(tenantId, customerId, action, "Registro atualizado", diff(oldData, newData), userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: table, entityId: id, oldData: safeChild(table, oldData), newData: safeChild(table, newData), ipAddress });
    await connection.commit();
    return table === "customer_documents" ? protectDocuments([newData], true)[0] : newData;
  } catch (error) {
    await connection.rollback();
    throw friendlyDuplicate(error);
  } finally {
    connection.release();
  }
}

async function childDelete({ tenantId, customerId, id, userId, ipAddress, table, action }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await requireCustomer(tenantId, customerId, connection);
    const oldData = await requireChild(table, tenantId, customerId, id, connection);
    await repo.softDeleteChild(table, tenantId, customerId, id, userId, connection);
    await repo.addChangeHistory(tenantId, customerId, action, "Registro removido", { id }, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action, entity: table, entityId: id, oldData: safeChild(table, oldData), newData: { deleted: true }, ipAddress });
    await connection.commit();
    return { id, deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getPreferences({ tenantId, customerId }) {
  await requireCustomer(tenantId, customerId);
  return await repo.getPreferences(tenantId, customerId);
}

async function updatePreferences({ tenantId, customerId, userId, ipAddress, data }) {
  validators.preferences(data);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await requireCustomer(tenantId, customerId, connection);
    const oldData = await repo.getPreferences(tenantId, customerId, connection);
    await repo.upsertPreferences(tenantId, customerId, data, connection);
    const newData = await repo.getPreferences(tenantId, customerId, connection);
    await repo.addChangeHistory(tenantId, customerId, "customer_preferences.update", "Preferencias atualizadas", diff(oldData, newData), userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "customer_preferences.update", entity: "customer_preferences", entityId: customerId, oldData, newData, ipAddress });
    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listConsents({ tenantId, customerId }) {
  await requireCustomer(tenantId, customerId);
  return { items: await repo.listConsents(tenantId, customerId) };
}

async function updateConsent({ tenantId, customerId, consentType, userId, ipAddress, data }) {
  validators.consent(data);
  if (!validators.enums.consentType.includes(consentType)) throw new AppError("Tipo de consentimento invalido", 400);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await requireCustomer(tenantId, customerId, connection);
    const id = await repo.addConsent(tenantId, customerId, consentType, data, userId, connection);
    await repo.addChangeHistory(tenantId, customerId, "customer_consent.update", `Consentimento ${consentType}`, { consentType, granted: Boolean(data.granted), source: data.source || "manual" }, userId, connection);
    await auditRepository.create(connection, { tenantId, userId, action: "customer_consent.update", entity: "customer_consents", entityId: id, newData: { consentType, granted: Boolean(data.granted), source: data.source || "manual" }, ipAddress });
    await connection.commit();
    return { id, consentType, granted: Boolean(data.granted) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createRelationship(params) {
  validators.relationship(params.data);
  if (Number(params.customerId) === Number(params.data.relatedCustomerId)) throw new AppError("Cliente nao pode se relacionar consigo mesmo", 400);
  await requireCustomer(params.tenantId, params.data.relatedCustomerId);
  return childCreate({ ...params, table: "customer_relationships", fields: relationshipFields, validate: () => {}, action: "customer_relationship.create" });
}

async function history({ tenantId, customerId }) {
  await requireCustomer(tenantId, customerId);
  return { items: await repo.listHistory(tenantId, customerId) };
}

async function summary({ tenantId, customerId, requester }) {
  const customer = await get({ tenantId, id: customerId, requester });
  const [contacts, addresses, preferences, counts] = await Promise.all([
    repo.listChild("customer_contacts", tenantId, customerId, "is_primary DESC, created_at DESC"),
    repo.listChild("customer_addresses", tenantId, customerId, "is_primary DESC, created_at DESC"),
    repo.getPreferences(tenantId, customerId),
    repo.summaryCounts(tenantId, customerId)
  ]);
  return { customer, primaryContact: contacts.find((item) => item.isPrimary) || null, primaryAddress: addresses.find((item) => item.isPrimary) || null, billingAddress: addresses.find((item) => item.isBilling) || null, preferences, ...counts, vehicles: 0 };
}

async function requireCustomer(tenantId, id, connection) {
  const customer = await repo.findById(tenantId, id, connection);
  if (!customer) throw new AppError("Cliente nao encontrado", 404);
  return customer;
}

async function requireChild(table, tenantId, customerId, id, connection) {
  const item = await repo.findChild(table, tenantId, customerId, id, connection);
  if (!item) throw new AppError("Registro nao encontrado", 404);
  return item;
}

async function validateUnique(tenantId, data, ignoreId, connection) {
  if (data.customerCode && await repo.existsValue(tenantId, "customer_code", data.customerCode, ignoreId, connection)) throw new AppError("Ja existe cliente com este codigo", 409);
  if (data.taxNumber && await repo.existsValue(tenantId, "tax_number", data.taxNumber, ignoreId, connection)) throw new AppError("Ja existe cliente com este numero fiscal", 409);
}

async function assertFinancialAllowed(tenantId, roleId, data) {
  if (!financialKeys.some((key) => data[key] !== undefined)) return;
  if (!await hasPermission(tenantId, roleId, "customers.view_financial_data")) throw new AppError("Permissao insuficiente para dados financeiros", 403);
}

async function assertChildAllowed(tenantId, roleId, table, data) {
  if (table !== "customer_notes") return;
  if (data.isConfidential && !await hasPermission(tenantId, roleId, "customer_notes.read_confidential")) throw new AppError("Permissao insuficiente para nota confidencial", 403);
  if (data.noteType === "financial" && !await hasPermission(tenantId, roleId, "customers.view_financial_data")) throw new AppError("Permissao insuficiente para nota financeira", 403);
}

async function accessFor(user) {
  return {
    financial: await hasPermission(user.tenantId, user.roleId, "customers.view_financial_data"),
    documents: await hasPermission(user.tenantId, user.roleId, "customers.view_documents"),
    notes: await hasPermission(user.tenantId, user.roleId, "customer_notes.read"),
    confidentialNotes: await hasPermission(user.tenantId, user.roleId, "customer_notes.read_confidential")
  };
}

async function hasPermission(tenantId, roleId, permissionCode) {
  if (!roleId) return false;
  return permissionRepository.roleHasPermission({ tenantId, roleId, permissionCode });
}

function mask(value) {
  if (!value) return null;
  const text = String(value);
  return `${"*".repeat(Math.max(text.length - 4, 3))}${text.slice(-4)}`;
}

function protectCustomer(customer, options = {}) {
  const item = { ...customer };
  item.taxNumber = mask(item.taxNumber);
  item.identityDocument = mask(item.identityDocument);
  if (!options.access || !options.access.financial) {
    delete item.creditLimit;
    delete item.paymentTermsDays;
    delete item.blockReason;
  }
  if (!options.detail) delete item.notes;
  return item;
}

function protectDocuments(documents, canViewFile) {
  return documents.map((document) => ({ ...document, documentNumber: mask(document.documentNumber), fileUrl: canViewFile ? document.fileUrl : undefined }));
}

function safeChild(table, item) {
  if (!item) return null;
  if (table === "customer_documents") return protectDocuments([item], false)[0];
  if (table === "customer_notes") return item.isConfidential ? { ...item, content: "[confidencial]" } : { ...item, contentLength: String(item.content || "").length, content: undefined };
  return item;
}

function diff(oldData, newData) {
  const changed = {};
  Object.keys(newData || {}).forEach((key) => {
    if (JSON.stringify(oldData && oldData[key]) !== JSON.stringify(newData[key])) changed[key] = { old: oldData && oldData[key], new: newData[key] };
  });
  return protectCustomer(changed, { detail: true });
}

function friendlyDuplicate(error) {
  if (error && error.code === "ER_DUP_ENTRY") return new AppError("Registro duplicado para esta empresa", 409);
  return error;
}

module.exports = {
  list,
  get,
  create,
  update,
  activate,
  deactivate,
  block,
  unblock,
  remove,
  childList,
  childCreate,
  childUpdate,
  childDelete,
  getPreferences,
  updatePreferences,
  listConsents,
  updateConsent,
  createRelationship,
  history,
  summary,
  requireCustomer,
  protectDocuments,
  fields: { contactFields, addressFields, documentFields, noteFields, relationshipFields },
  validators
};
