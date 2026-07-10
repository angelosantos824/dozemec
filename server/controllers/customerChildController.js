const service = require("../services/customerService");
const apiResponse = require("../utils/apiResponse");

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res);
  } catch (error) {
    return next(error);
  }
};

function crud({ table, fields, validate, actionBase, idParam }) {
  return {
    list: wrap(async (req, res) => apiResponse.success(res, await service.childList({ tenantId: req.user.tenantId, customerId: req.params.id, table }))),
    create: wrap(async (req, res) => apiResponse.success(res, await service.childCreate({ tenantId: req.user.tenantId, customerId: req.params.id, userId: req.user.id, roleId: req.user.roleId, ipAddress: req.ip, table, fields, validate, action: `${actionBase}.create`, data: req.body }), 201)),
    update: wrap(async (req, res) => apiResponse.success(res, await service.childUpdate({ tenantId: req.user.tenantId, customerId: req.params.id, id: req.params[idParam], userId: req.user.id, roleId: req.user.roleId, ipAddress: req.ip, table, fields, validate, action: `${actionBase}.update`, data: req.body }))),
    remove: wrap(async (req, res) => apiResponse.success(res, await service.childDelete({ tenantId: req.user.tenantId, customerId: req.params.id, id: req.params[idParam], userId: req.user.id, ipAddress: req.ip, table, action: `${actionBase}.delete` })))
  };
}

module.exports = {
  contacts: crud({ table: "customer_contacts", fields: service.fields.contactFields, validate: service.validators.contact, actionBase: "customer_contact", idParam: "contactId" }),
  addresses: crud({ table: "customer_addresses", fields: service.fields.addressFields, validate: service.validators.address, actionBase: "customer_address", idParam: "addressId" }),
  documents: crud({ table: "customer_documents", fields: service.fields.documentFields, validate: service.validators.document, actionBase: "customer_document", idParam: "documentId" }),
  notes: crud({ table: "customer_notes", fields: service.fields.noteFields, validate: service.validators.note, actionBase: "customer_note", idParam: "noteId" }),
  relationships: {
    list: wrap(async (req, res) => apiResponse.success(res, await service.childList({ tenantId: req.user.tenantId, customerId: req.params.id, table: "customer_relationships" }))),
    create: wrap(async (req, res) => apiResponse.success(res, await service.createRelationship({ tenantId: req.user.tenantId, customerId: req.params.id, userId: req.user.id, ipAddress: req.ip, data: req.body }), 201)),
    remove: wrap(async (req, res) => apiResponse.success(res, await service.childDelete({ tenantId: req.user.tenantId, customerId: req.params.id, id: req.params.relationshipId, userId: req.user.id, ipAddress: req.ip, table: "customer_relationships", action: "customer_relationship.delete" })))
  },
  preferences: {
    show: wrap(async (req, res) => apiResponse.success(res, await service.getPreferences({ tenantId: req.user.tenantId, customerId: req.params.id }))),
    update: wrap(async (req, res) => apiResponse.success(res, await service.updatePreferences({ tenantId: req.user.tenantId, customerId: req.params.id, userId: req.user.id, ipAddress: req.ip, data: req.body })))
  },
  consents: {
    list: wrap(async (req, res) => apiResponse.success(res, await service.listConsents({ tenantId: req.user.tenantId, customerId: req.params.id }))),
    update: wrap(async (req, res) => apiResponse.success(res, await service.updateConsent({ tenantId: req.user.tenantId, customerId: req.params.id, consentType: req.params.consentType, userId: req.user.id, ipAddress: req.ip, data: req.body })))
  },
  history: {
    list: wrap(async (req, res) => apiResponse.success(res, await service.history({ tenantId: req.user.tenantId, customerId: req.params.id }))),
    summary: wrap(async (req, res) => apiResponse.success(res, await service.summary({ tenantId: req.user.tenantId, customerId: req.params.id, requester: req.user })))
  }
};
