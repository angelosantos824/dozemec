const express = require("express");
const controller = require("../controllers/userController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("users.read"), controller.list);
router.post("/", authenticate, authorize("users.create"), controller.create);
router.get("/:id", authenticate, authorize("users.read"), controller.show);
router.put("/:id", authenticate, authorize("users.update"), controller.update);
router.patch("/:id/block", authenticate, authorize("users.block"), controller.block);
router.patch("/:id/activate", authenticate, authorize("users.activate"), controller.activate);
router.patch("/:id/deactivate", authenticate, authorize("users.update"), controller.deactivate);
router.post("/:id/reset-password", authenticate, authorize("users.reset_password"), controller.resetPassword);
router.get("/:id/login-history", authenticate, authorize("users.view_login_history"), controller.loginHistory);
router.delete("/:id", authenticate, authorize("users.delete"), controller.remove);

module.exports = router;
