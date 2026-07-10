const pool = require("../config/database");
const { parsePagination } = require("../utils/pagination");
const auditRepository = require("../repositories/auditRepository");

async function list(tenantId, query) {
  const pagination = parsePagination(query, { createdAt: "created_at" }, "createdAt");
  const result = await auditRepository.list(pool, { tenantId, filters: query, pagination });
  return { items: result.rows, pagination: pagination.meta(result.total) };
}

module.exports = { list };
