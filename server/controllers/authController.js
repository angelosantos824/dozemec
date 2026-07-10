const authService = require("../services/authService");
const apiResponse = require("../utils/apiResponse");

async function login(req, res, next) {
  try {
    const data = await authService.login({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return apiResponse.success(res, data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  async me(req, res, next) {
    try {
      return apiResponse.success(res, await authService.me(req.user));
    } catch (error) {
      return next(error);
    }
  }
};
