const { body } = require("express-validator");

const editProfileValidation = () => {
  return [
    body("firstName")
      .notEmpty()
      .withMessage("first name is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("first name must be  at least 3 chars or 20 chars maximum"),

    body("lastName")
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Last name must be  at least 3 chars or 20 chars maximum"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),

    body("mobilePhone")
      .notEmpty()
      .withMessage("Mobile phone is required")
      .isMobilePhone("any")
      .withMessage("Invalid mobile phone number"),

    body("address")
      .notEmpty()
      .withMessage("address is required")
      .optional()
      .isLength({ min: 5, max: 100 })
      .withMessage(
        "Address must be at least 5 characters and at most 100 characters"
      ),

    body("currentPassword")
      .optional()
      .isLength({ min: 9, max: 25 })
      .withMessage(
        "Current password length must be between 9 and 25 characters"
      ),

    body("newPassword")
      .optional()
      .isLength({ min: 9, max: 25 })
      .withMessage("New password length must be between 9 and 25 characters"),
  ];
};

module.exports = { editProfileValidation };
