const express = require("express");
const companySettingsController = require("../controllers/companySettingsController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/settings", authenticate, authorize("company_settings.read"), companySettingsController.show);
router.put("/settings", authenticate, authorize("company_settings.update"), companySettingsController.update);
router.get("/business-hours", authenticate, authorize("business_hours.read"), companySettingsController.businessHours);
router.put(
  "/business-hours",
  authenticate,
  authorize("business_hours.update"),
  companySettingsController.updateBusinessHours
);
router.get("/integrations", authenticate, authorize("integrations.read"), companySettingsController.integrations);
router.put(
  "/integrations/:integrationType",
  authenticate,
  authorize("integrations.update"),
  companySettingsController.updateIntegration
);

module.exports = router;
