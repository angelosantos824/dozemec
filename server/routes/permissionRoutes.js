const express = require("express");
const controller = require("../controllers/permissionController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("permissions.read"), controller.list);

module.exports = router;
