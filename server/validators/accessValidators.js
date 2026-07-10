const AppError = require("../utils/AppError");
const { assertAllowedFields, isEmail, isUrl } = require("./commonValidators");

const statuses = ["active", "inactive", "blocked"];
const baseUserFields = ["name", "email", "username", "phone", "avatarUrl", "sectorId", "roleId", "status"];

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function normalizeUsername(value) {
  return value ? String(value).trim().toLowerCase() : null;
}

function normalizeEmail(value) {
  return value ? String(value).trim().toLowerCase() : value;
}

function validatePassword(password) {
  if (
    !password ||
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new AppError("A senha deve ter 8 caracteres, maiuscula, minuscula, numero e caractere especial", 400);
  }
}

function validateUserCreate(body) {
  assertAllowedFields(body, [...baseUserFields, "password"]);
  if (!body.name || !String(body.name).trim()) throw new AppError("O nome e obrigatorio", 400);
  if (!body.email || !isEmail(body.email)) throw new AppError("O e-mail deve ser valido", 400);
  validatePassword(body.password);
  validateUserFields(body);
}

function validateUserUpdate(body) {
  assertAllowedFields(body, baseUserFields);
  validateUserFields(body);
}

function validateUserFields(body) {
  if (body.email !== undefined && !isEmail(body.email)) throw new AppError("O e-mail deve ser valido", 400);
  if (body.avatarUrl !== undefined && !isUrl(body.avatarUrl)) throw new AppError("A URL do avatar deve ser valida", 400);
  if (body.status !== undefined && !statuses.includes(body.status)) throw new AppError("Status de usuario invalido", 400);
  if (body.username !== undefined && body.username && !/^[a-zA-Z0-9._-]{3,80}$/.test(body.username)) {
    throw new AppError("O username deve ter ao menos 3 caracteres e usar apenas letras, numeros, ponto, hifen ou underscore", 400);
  }
}

function validateSector(body, partial = false) {
  assertAllowedFields(body, ["name", "code", "description", "displayOrder", "status"]);
  if (!partial && (!body.name || !String(body.name).trim())) throw new AppError("O nome do setor e obrigatorio", 400);
  if (body.status !== undefined && !["active", "inactive"].includes(body.status)) throw new AppError("Status de setor invalido", 400);
}

function validateRole(body, partial = false) {
  assertAllowedFields(body, ["name", "code", "description", "displayOrder", "status", "permissionIds"]);
  if (!partial && (!body.name || !String(body.name).trim())) throw new AppError("O nome do perfil e obrigatorio", 400);
  if (body.status !== undefined && !["active", "inactive"].includes(body.status)) throw new AppError("Status de perfil invalido", 400);
  if (body.permissionIds !== undefined) validatePermissionIds(body.permissionIds);
}

function validatePermissionIds(permissionIds) {
  if (!Array.isArray(permissionIds)) throw new AppError("Informe uma lista de permissoes", 400);
  const unique = new Set(permissionIds.map(Number));
  if (unique.size !== permissionIds.length || [...unique].some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new AppError("A lista de permissoes contem valores invalidos ou duplicados", 400);
  }
}

module.exports = {
  normalizeCode,
  normalizeEmail,
  normalizeUsername,
  validatePassword,
  validateUserCreate,
  validateUserUpdate,
  validateSector,
  validateRole,
  validatePermissionIds
};
