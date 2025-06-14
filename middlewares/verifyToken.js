const appError = require("../utils/appError");
const { httpStatusText } = require("../utils/constants");
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeaders = req.headers.authorization || req.headers.Authorization;

  const token =
    req?.body?.activationToken ||
    req?.headers?.token ||
    authHeaders?.split(" ")[1];
  if (!token) {
    const error = appError.create(
      { ar: "الرجاء تسجيل الدخول للمتابعة", en: "Please , login to continue" },
      401,
      httpStatusText.FAIL
    );
    return next(error);
  }

  try {
    const current = jwt.verify(token, process.env.jwt_secret_key);
    current.token = token;
    req.current = current;
    next();
  } catch (err) {
    const error = appError.create("invalid token", 400, httpStatusText.ERROR);

    return next(error);
  }
};
module.exports = verifyToken;
