const apiResponse = require("../utils/apiResponse");

function notFound(req, res, next) {
  const error = new Error(`Rota nao encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : err.message || "Erro interno do servidor";

  return apiResponse.error(res, message, statusCode);
}

module.exports = {
  notFound,
  errorHandler
};
