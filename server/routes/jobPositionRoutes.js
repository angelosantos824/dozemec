const express = require("express");
const controller = require("../controllers/jobPositionController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("job_positions.read"), controller.list);
router.post("/", authenticate, authorize("job_positions.create"), controller.create);
router.get("/:id", authenticate, authorize("job_positions.read"), controller.show);
router.put("/:id", authenticate, authorize("job_positions.update"), controller.update);
router.delete("/:id", authenticate, authorize("job_positions.delete"), controller.remove);

module.exports = router;
