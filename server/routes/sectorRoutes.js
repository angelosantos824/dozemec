const express = require("express");
const controller = require("../controllers/sectorController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("sectors.read"), controller.list);
router.post("/", authenticate, authorize("sectors.create"), controller.create);
router.get("/:id", authenticate, authorize("sectors.read"), controller.show);
router.put("/:id", authenticate, authorize("sectors.update"), controller.update);
router.delete("/:id", authenticate, authorize("sectors.delete"), controller.remove);

module.exports = router;
