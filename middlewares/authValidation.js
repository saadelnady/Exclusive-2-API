const { body } = require("express-validator");

const loginValidation = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),

    body("password").notEmpty().withMessage("password is required"),
  ];
};

 
const registerValidation = () => {
  return [
    body("firstName")
      .notEmpty()
      .withMessage("first name is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("name must be  at least 3 chars or 20 chars maximum"),

    body("lastName")
      .notEmpty()
      .withMessage("last name is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("name must be  at least 3 chars or 20 chars maximum"),

    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),

    body("password")
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 9, max: 25 })
      .withMessage("password length must between 9 and 25 characters "),

    body("mobilePhone")
      .notEmpty()
      .withMessage("mobile phone is required")
      .isMobilePhone("any")
      .withMessage("Invalid mobile phone number"),
  ];
};

module.exports ={ registerValidation,loginValidation};