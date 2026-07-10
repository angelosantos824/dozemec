const express = require("express");
const apiResponse = require("../utils/apiResponse");

const router = express.Router();

router.get("/health", (req, res) => {
  return apiResponse.message(res, "API DOZEMEC funcionando");
});

module.exports = router;
