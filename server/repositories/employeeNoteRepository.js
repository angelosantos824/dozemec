const repo = require("./employeeRepository");

module.exports = {
  listNotes: repo.listNotes,
  findNote: repo.findNote,
  createNote: repo.createNote,
  updateNote: repo.updateNote,
  softDeleteNote: repo.softDeleteNote
};
