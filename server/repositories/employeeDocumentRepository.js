const repo = require("./employeeRepository");

module.exports = {
  listDocuments: repo.listDocuments,
  findDocument: repo.findDocument,
  createDocument: repo.createDocument,
  updateDocument: repo.updateDocument,
  softDeleteDocument: repo.softDeleteDocument
};
