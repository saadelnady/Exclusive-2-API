const jwt = require("jsonwebtoken");

const generateToken = (payLoad) => {
  const token = jwt.sign(payLoad, process.env.jwt_secret_key, {
    expiresIn: "10d",
  });
  return token;
};
module.exports = generateToken;
