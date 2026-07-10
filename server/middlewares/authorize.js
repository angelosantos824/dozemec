const AppError = require("../utils/AppError");
const permissionRepository = require("../repositories/permissionRepository");

function authorize(permissionCode) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError("Usuario nao autenticado", 401);
      }

      const allowed = await permissionRepository.roleHasPermission({
        roleId: req.user.roleId,
        tenantId: req.user.tenantId,
        permissionCode
      });

      if (!allowed) {
        throw new AppError("Permissao insuficiente", 403);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = authorize;
