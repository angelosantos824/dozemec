const express = require("express");
const controller = require("../controllers/roleController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("roles.read"), controller.list);
router.post("/", authenticate, authorize("roles.create"), controller.create);
router.get("/:id", authenticate, authorize("roles.read"), controller.show);
router.put("/:id", authenticate, authorize("roles.update"), controller.update);
router.put("/:id/permissions", authenticate, authorize("roles.manage_permissions"), controller.updatePermissions);
router.delete("/:id", authenticate, authorize("roles.delete"), controller.remove);

module.exports = router;
