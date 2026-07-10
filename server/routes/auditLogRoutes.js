const express = require("express");
const controller = require("../controllers/auditLogController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("audit_logs.read"), controller.list);

module.exports = router;
