const authService = require("../services/authService");
const apiResponse = require("../utils/apiResponse");

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login
};
