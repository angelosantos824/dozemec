const express = require("express");
const c = require("../controllers/workshopMapController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const router = express.Router();
router.get("/", authenticate, authorize("workshop_map.read"), c.show);
module.exports = router;
