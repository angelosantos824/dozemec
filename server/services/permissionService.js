const permissionRepository = require("../repositories/permissionRepository");

async function listGrouped() {
  return permissionRepository.listGrouped();
}

module.exports = { listGrouped };
