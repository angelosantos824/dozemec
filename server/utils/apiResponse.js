function success(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data
  });
}

function message(res, text, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message: text
  });
}

function error(res, text, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message: text
  });
}

module.exports = {
  success,
  message,
  error
};
