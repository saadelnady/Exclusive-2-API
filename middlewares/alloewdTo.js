const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");

module.exports = (...roles) => {
  return (req, res, next) => {
    const currentUserRole = req?.current?.role;
     if (!roles.includes(currentUserRole)) {
      const error = appError.create(
        "you aren't allowed to this",
        400,
        httpStatusText.FAIL
      );
      next(error);
    } else {
      next();
    }
  };
};
