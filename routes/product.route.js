const express = require("express");
const Router = express.Router();
const multer = require("multer");

const { storage, fileFilter } = require("../utils/multer");
const upload = multer({ storage: storage, fileFilter });

const {
  getProducts,
  addProduct,
  getProduct,
  editProduct,
  deleteProduct,
  getAcceptedSellerProducts,
  acceptProduct,
  blockProduct,
  unblockProduct,
} = require("../controller/product.controller");

const allowedTo = require("../middlewares/alloewdTo");
const roles = require("../utils/roles");
const { productValidation } = require("../middlewares/productValidation");
const verifyToken = require("../middlewares/verifyToken");

Router.route("/")
  .get(getProducts)
  .post(upload.array("images", 10), productValidation(), addProduct);

Router.route("/acceptedSellerProducts").get(getAcceptedSellerProducts);

Router.route("/:productId").get(getProduct);

Router.route("/:productId").put(
  verifyToken,
  allowedTo(roles.SELLER),
  upload.array("images", 10),
  productValidation(),
  editProduct
);

Router.route("/:productId").delete(
  verifyToken,
  allowedTo(roles.SELLER),
  deleteProduct
);

Router.route("/acceptProduct/:productId").put(
  verifyToken,
  allowedTo(roles.ADMIN),
  acceptProduct
);
Router.route("/blockProduct/:productId").put(
  verifyToken,
  allowedTo(roles.ADMIN),
  blockProduct
);
Router.route("/unblockProduct/:productId").put(
  verifyToken,
  allowedTo(roles.ADMIN),
  unblockProduct
);
module.exports = Router;
