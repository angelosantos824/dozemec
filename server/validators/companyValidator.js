const AppError = require("../utils/AppError");
const { assertAllowedFields, isEmail, isHexColor, isUrl } = require("./commonValidators");

const companyFields = [
  "legalName",
  "tradeName",
  "taxNumber",
  "stateRegistration",
  "email",
  "phone",
  "secondaryPhone",
  "whatsapp",
  "website",
  "postalCode",
  "address",
  "addressNumber",
  "addressComplement",
  "neighborhood",
  "city",
  "state",
  "country",
  "timezone",
  "locale",
  "currency",
  "currencySymbol"
];

const brandingFields = [
  "logoUrl",
  "faviconUrl",
  "loginImageUrl",
  "dashboardImageUrl",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "theme"
];

function validateCompanyUpdate(body) {
  assertAllowedFields(body, companyFields);

  if (!isEmail(body.email)) throw new AppError("O e-mail deve ser valido", 400);
  if (!isUrl(body.website)) throw new AppError("O website deve ser uma URL valida", 400);
  if (body.timezone !== undefined && !String(body.timezone).trim()) {
    throw new AppError("O timezone nao pode estar vazio", 400);
  }
  if (body.locale !== undefined && !/^[a-z]{2}-[A-Z]{2}$/.test(body.locale)) {
    throw new AppError("O locale deve estar em formato valido", 400);
  }
  if (body.currency !== undefined && !/^[A-Z]{3}$/.test(body.currency)) {
    throw new AppError("A moeda deve possuir tres caracteres", 400);
  }
  if (body.currencySymbol !== undefined && !String(body.currencySymbol).trim()) {
    throw new AppError("O simbolo monetario nao pode estar vazio", 400);
  }
}

function validateBrandingUpdate(body) {
  assertAllowedFields(body, brandingFields);

  const urlFields = ["logoUrl", "faviconUrl", "loginImageUrl", "dashboardImageUrl"];
  for (const field of urlFields) {
    if (!isUrl(body[field])) throw new AppError("A URL da imagem deve ser valida", 400);
  }

  if (!isHexColor(body.primaryColor)) {
    throw new AppError("A cor principal deve estar em formato hexadecimal valido", 400);
  }
  if (!isHexColor(body.secondaryColor)) {
    throw new AppError("A cor secundaria deve estar em formato hexadecimal valido", 400);
  }
  if (!isHexColor(body.accentColor)) {
    throw new AppError("A cor de destaque deve estar em formato hexadecimal valido", 400);
  }
  if (body.theme !== undefined && !["light", "dark", "system"].includes(body.theme)) {
    throw new AppError("O tema deve ser light, dark ou system", 400);
  }
}

module.exports = {
  validateCompanyUpdate,
  validateBrandingUpdate
};
