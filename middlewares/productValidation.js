const { body } = require("express-validator");

const productValidation = () => {
  return [
    body("title")
      .notEmpty()
      .withMessage("Product title is required")
      .isLength({ min: 3, max: 100 })
      .withMessage("Product title must be between 3 and 100 characters"),

    body("description")
      .notEmpty()
      .withMessage("Product description is required")
      .isLength({ min: 10, max: 500 })
      .withMessage(
        "Product description must be between 10 and 500 characters "
      ),

    body("category")
      .notEmpty()
      .withMessage("Product category is required")
      .isMongoId()
      .withMessage("Invalid category ID"),

    body("subCategory")
      .notEmpty()
      .withMessage("Product subcategory is required")
      .isMongoId()
      .withMessage("Invalid subcategory ID"),

    body("productOwner")
      .notEmpty()
      .withMessage("Product owner is required")
      .isMongoId()
      .withMessage("Invalid product owner ID"),

    body("options.*.size")
      .notEmpty()
      .withMessage("Size is required for all options"),

    body("options.*.color")
      .notEmpty()
      .withMessage("Color is required for all options"),

    body("options.*.stockCount")
      .notEmpty()
      .withMessage("stockCount is required for all options"),

    body("options.*.price.priceBeforeDiscount")
      .notEmpty()
      .withMessage("priceBeforeDiscount is required for all options"),

    // body("options.*.price.discountPercentage")
    //   .notEmpty()
    //   .withMessage("priceBeforeDiscount is required for all options"),

    body("options.*.price.finalPrice")
      .notEmpty()
      .withMessage("finalPrice is required for all options"),

    // body("options.*.price.discountValue")
    //   .notEmpty()
    //   .withMessage("discountValue is required for all options"),
  ];
};

module.exports = { productValidation };
