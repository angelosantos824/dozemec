const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/AppError");

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Token nao informado", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, env.jwt.secret);

    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      sectorId: decoded.sectorId,
      roleId: decoded.roleId,
      email: decoded.email
    };

    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new AppError("Token invalido ou expirado", 401));
    }

    return next(error);
  }
}

module.exports = authenticate;
