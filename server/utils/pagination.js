const AppError = require("./AppError");

function parsePagination(query, allowedSortFields, defaultSortBy = "created_at") {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const sortOrder = String(query.sortOrder || "desc").toLowerCase();
  const sortBy = query.sortBy || defaultSortBy;

  if (!["asc", "desc"].includes(sortOrder)) {
    throw new AppError("A ordenacao deve ser asc ou desc", 400);
  }
  if (!allowedSortFields[sortBy]) {
    throw new AppError("Campo de ordenacao invalido", 400);
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sortBy,
    sortColumn: allowedSortFields[sortBy],
    sortOrder,
    meta(totalItems) {
      return {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      };
    }
  };
}

module.exports = { parsePagination };
