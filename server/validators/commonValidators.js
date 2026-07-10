const AppError = require("../utils/AppError");

function isEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

function isHexColor(value) {
  return !value || /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(value);
}

function isTime(value) {
  return value === null || value === undefined || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function assertAllowedFields(body, allowedFields) {
  const invalid = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (invalid.length > 0) {
    throw new AppError(`Campo nao permitido: ${invalid[0]}`, 400);
  }
}

function assertPercentage(value, message) {
  if (value === undefined) return;
  const number = Number(value);
  if (Number.isNaN(number) || number < 0 || number > 100) {
    throw new AppError(message, 400);
  }
}

module.exports = {
  isEmail,
  isUrl,
  isHexColor,
  isTime,
  timeToMinutes,
  assertAllowedFields,
  assertPercentage
};
