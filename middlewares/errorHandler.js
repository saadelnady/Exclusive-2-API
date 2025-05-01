const appError = require("../utils/appError");
const httpStatusText = require("../utils/appError");

module.exports = (error, req, res, next) => {
  if (error.name === "CastError") {
    const message = `Resoureses not found with this id .. Invalid ${error.path}`;
    appError.create(message, 400, error.statusText);
  }
  return res.status(400).json({
    status: error.statusText || httpStatusText.ERROR,
    message: error.message || "Internal Server Error",
    code: error.statusCode,
    data: null,
  });
};
