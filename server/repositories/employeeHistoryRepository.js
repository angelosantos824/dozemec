const repo = require("./employeeRepository");

module.exports = {
  addStatusHistory: repo.addStatusHistory,
  addUserLinkHistory: repo.addUserLinkHistory,
  listHistory: repo.listHistory
};
