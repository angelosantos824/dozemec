const express = require("express");
const controller = require("../controllers/employeeSpecialtyController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("employee_specialties.read"), controller.list);
router.post("/", authenticate, authorize("employee_specialties.create"), controller.create);
router.get("/:id", authenticate, authorize("employee_specialties.read"), controller.show);
router.put("/:id", authenticate, authorize("employee_specialties.update"), controller.update);
router.delete("/:id", authenticate, authorize("employee_specialties.delete"), controller.remove);

module.exports = router;
