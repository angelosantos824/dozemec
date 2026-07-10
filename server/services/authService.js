const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const pool = require("../config/database");
const AppError = require("../utils/AppError");
const userRepository = require("../repositories/userRepository");
const loginHistoryRepository = require("../repositories/loginHistoryRepository");
const permissionRepository = require("../repositories/permissionRepository");

async function login({ email, password, ipAddress, userAgent }) {
  if (!email || !password) {
    throw new AppError("E-mail e senha sao obrigatorios", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await userRepository.findActiveByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("E-mail ou senha invalidos", 401);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (
      user.deleted_at ||
      user.tenant_status !== "active" ||
      user.status === "inactive" ||
      user.status === "blocked"
    ) {
      await loginHistoryRepository.create(connection, {
        tenantId: user.tenant_id,
        userId: user.id,
        emailAttempted: normalizedEmail,
        success: false,
        failureReason: "usuario_inativo_ou_bloqueado",
        ipAddress,
        userAgent
      });
      await connection.commit();
      throw new AppError("E-mail ou senha invalidos", 401);
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await loginHistoryRepository.create(connection, {
        tenantId: user.tenant_id,
        userId: user.id,
        emailAttempted: normalizedEmail,
        success: false,
        failureReason: "bloqueio_temporario",
        ipAddress,
        userAgent
      });
      await connection.commit();
      throw new AppError("Acesso temporariamente bloqueado. Tente novamente mais tarde.", 423);
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      const attempts = Number(user.failed_login_attempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await userRepository.incrementFailedLogin(user.id, user.tenant_id, attempts, lockedUntil, connection);
      await loginHistoryRepository.create(connection, {
        tenantId: user.tenant_id,
        userId: user.id,
        emailAttempted: normalizedEmail,
        success: false,
        failureReason: attempts >= 5 ? "bloqueio_apos_tentativas" : "senha_invalida",
        ipAddress,
        userAgent
      });
      await connection.commit();
      throw new AppError("E-mail ou senha invalidos", 401);
    }

    await userRepository.updateLastLogin(user.id, user.tenant_id, connection);
    await loginHistoryRepository.create(connection, {
      tenantId: user.tenant_id,
      userId: user.id,
      emailAttempted: normalizedEmail,
      success: true,
      ipAddress,
      userAgent
    });

    await connection.commit();
  } catch (error) {
    if (!error.isOperational) await connection.rollback();
    throw error;
  } finally {
    connection.release();
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

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenant_id,
      sector: user.sector_name,
      role: user.role_name,
      mustChangePassword: Boolean(user.must_change_password)
    }
  };
}

module.exports = {
  login,
  async me(user) {
    const permissions = await permissionRepository.listCodesByRole(user.roleId, user.tenantId);
    return {
      id: user.id,
      tenantId: user.tenantId,
      sectorId: user.sectorId,
      roleId: user.roleId,
      email: user.email,
      permissions
    };
  }
};
