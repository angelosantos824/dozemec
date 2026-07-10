const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const userRepository = require("../repositories/userRepository");

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError("E-mail e senha sao obrigatorios", 400);
  }

  const user = await userRepository.findActiveByEmail(email);

  if (!user || user.status !== "active" || user.tenant_status !== "active") {
    throw new AppError("Credenciais invalidas", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new AppError("Credenciais invalidas", 401);
  }

  const tokenPayload = {
    id: user.id,
    tenantId: user.tenant_id,
    sectorId: user.sector_id,
    roleId: user.role_id,
    email: user.email
  };

  const token = jwt.sign(tokenPayload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn
  });

  await userRepository.updateLastLogin(user.id, user.tenant_id);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenant_id,
      sector: user.sector_name,
      role: user.role_name
    }
  };
}

module.exports = {
  login
};
