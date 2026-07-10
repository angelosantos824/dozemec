const express = require("express");
const controller = require("../controllers/employeeController");
const scheduleController = require("../controllers/employeeScheduleController");
const documentController = require("../controllers/employeeDocumentController");
const noteController = require("../controllers/employeeNoteController");
const historyController = require("../controllers/employeeHistoryController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("employees.read"), controller.list);
router.post("/", authenticate, authorize("employees.create"), controller.create);
router.get("/:id/summary", authenticate, authorize("employees.read"), historyController.summary);
router.get("/:id/history", authenticate, authorize("employees.view_history"), historyController.list);
router.get("/:id/schedule", authenticate, authorize("employee_schedules.read"), scheduleController.show);
router.put("/:id/schedule", authenticate, authorize("employee_schedules.update"), scheduleController.update);
router.get("/:id/documents", authenticate, authorize("employees.view_documents"), documentController.list);
router.post("/:id/documents", authenticate, authorize("employees.manage_documents"), documentController.create);
router.put("/:id/documents/:documentId", authenticate, authorize("employees.manage_documents"), documentController.update);
router.delete("/:id/documents/:documentId", authenticate, authorize("employees.manage_documents"), documentController.remove);
router.get("/:id/notes", authenticate, authorize("employee_notes.read"), noteController.list);
router.post("/:id/notes", authenticate, authorize("employee_notes.create"), noteController.create);
router.put("/:id/notes/:noteId", authenticate, authorize("employee_notes.update"), noteController.update);
router.delete("/:id/notes/:noteId", authenticate, authorize("employee_notes.delete"), noteController.remove);
router.put("/:id/user-link", authenticate, authorize("employees.link_user"), controller.updateUserLink);
router.delete("/:id/user-link", authenticate, authorize("employees.link_user"), controller.removeUserLink);
router.patch("/:id/activate", authenticate, authorize("employees.activate"), controller.activate);
router.patch("/:id/deactivate", authenticate, authorize("employees.deactivate"), controller.deactivate);
router.patch("/:id/terminate", authenticate, authorize("employees.update"), controller.terminate);
router.get("/:id", authenticate, authorize("employees.read"), controller.show);
router.put("/:id", authenticate, authorize("employees.update"), controller.update);
router.delete("/:id", authenticate, authorize("employees.delete"), controller.remove);

module.exports = router;
