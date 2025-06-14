const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");

module.exports = (...roles) => {
  return (req, res, next) => {
    const currentUserRole = req?.current?.role;
    if (!roles.includes(currentUserRole)) {
      const error = appError.create(
        {
          ar: "لا يمكنك الوصول لهذه الصفحة",
          en: "You can't access this page",
        },
        400,
        httpStatusText.FAIL
      );
      next(error);
    } else {
      next();
    }
  };
};
