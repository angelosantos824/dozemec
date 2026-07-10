const pool = require("../config/database");

const companyColumns = {
  legalName: "legal_name",
  tradeName: "trade_name",
  taxNumber: "tax_number",
  stateRegistration: "state_registration",
  email: "email",
  phone: "phone",
  secondaryPhone: "secondary_phone",
  whatsapp: "whatsapp",
  website: "website",
  postalCode: "postal_code",
  address: "address",
  addressNumber: "address_number",
  addressComplement: "address_complement",
  neighborhood: "neighborhood",
  city: "city",
  state: "state",
  country: "country",
  logoUrl: "logo_url",
  faviconUrl: "favicon_url",
  loginImageUrl: "login_image_url",
  dashboardImageUrl: "dashboard_image_url",
  primaryColor: "primary_color",
  secondaryColor: "secondary_color",
  accentColor: "accent_color",
  theme: "theme",
  timezone: "timezone",
  locale: "locale",
  currency: "currency",
  currencySymbol: "currency_symbol"
};

function mapTenant(row) {
  if (!row) return null;
  return {
    id: row.id,
    legalName: row.legal_name || row.name,
    tradeName: row.trade_name,
    taxNumber: row.tax_number,
    stateRegistration: row.state_registration,
    email: row.email,
    phone: row.phone,
    secondaryPhone: row.secondary_phone,
    whatsapp: row.whatsapp,
    website: row.website,
    postalCode: row.postal_code,
    address: row.address,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    country: row.country,
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    loginImageUrl: row.login_image_url,
    dashboardImageUrl: row.dashboard_image_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    theme: row.theme,
    timezone: row.timezone,
    locale: row.locale,
    currency: row.currency,
    currencySymbol: row.currency_symbol
  };
}

async function findByTenantId(tenantId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT id, name, legal_name, trade_name, tax_number, state_registration, email, phone,
      secondary_phone, whatsapp, website, postal_code, address, address_number,
      address_complement, neighborhood, city, state, country, logo_url, favicon_url,
      login_image_url, dashboard_image_url, primary_color, secondary_color, accent_color,
      theme, timezone, locale, currency, currency_symbol
    FROM tenants
    WHERE id = ?
    LIMIT 1`,
    [tenantId]
  );

  return mapTenant(rows[0]);
}

async function update(tenantId, data, connection) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;

  const assignments = entries.map(([field]) => `${companyColumns[field]} = ?`).join(", ");
  const values = entries.map(([, value]) => value);

  await connection.execute(`UPDATE tenants SET ${assignments} WHERE id = ?`, [...values, tenantId]);
}

module.exports = {
  findByTenantId,
  update
};
