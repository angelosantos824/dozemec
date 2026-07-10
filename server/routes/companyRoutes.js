const express = require("express");
const companyController = require("../controllers/companyController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorize("company.read"), companyController.show);
router.put("/", authenticate, authorize("company.update"), companyController.update);
router.get("/branding", authenticate, authorize("company_branding.read"), companyController.showBranding);
router.put("/branding", authenticate, authorize("company_branding.update"), companyController.updateBranding);

module.exports = router;
