const express = require("express");
const Router = express.Router();

const {
  getProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
  getAcceptedSellerProducts,
} = require("../controller/product.controller.js");

const allowedTo = require("../middlewares/alloewdTo");
const { roles } = require("../utils/constants");
const { productValidation } = require("../middlewares/productValidation");
const verifyToken = require("../middlewares/verifyToken");

Router.route("/").get(getProducts).post(productValidation(), addProduct);

Router.route("/acceptedSellerProducts").get(getAcceptedSellerProducts);

Router.route("/:productId").get(getProduct);

Router.route("/:productId").put(
  verifyToken,
  allowedTo(roles.SELLER),

  productValidation(),
  editProduct
);

Router.route("/:productId").delete(
  verifyToken,
  allowedTo(roles.SELLER),
  deleteProduct
);

module.exports = Router;
