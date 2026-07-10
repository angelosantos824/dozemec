const express = require("express");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("./authRoutes");
const companyRoutes = require("./companyRoutes");
const companySettingsRoutes = require("./companySettingsRoutes");

const router = express.Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/company", companyRoutes);
router.use("/company", companySettingsRoutes);

module.exports = router;
