const { body } = require("express-validator");

const addCategoryValidation = () => {
  return [
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Title must be  at least 3 chars or 20 chars maximum"),
  ];
};

const editCategoryValidation = () => {
  return [
    body("title")
      .isLength({ min: 3, max: 20 })
      .withMessage("Title must be  at least 3 chars or 20 chars maximum"),
  ];
};
module.exports = { addCategoryValidation, editCategoryValidation };
