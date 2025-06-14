const express = require("express");

const {
  addToCart,
  getCart,
  deleteProductFromCart,
  editCart,
} = require("../controller/cart.controller.js");
const alloewdTo = require("../middlewares/alloewdTo");
const { roles } = require("../utils/constants");
const verifyToken = require("../middlewares/verifyToken");

const Router = express.Router();

Router.route("/").post(verifyToken, alloewdTo(roles.USER), addToCart);
Router.route("/")
  .get(verifyToken, alloewdTo(roles.USER), getCart)
  .delete(verifyToken, alloewdTo(roles.USER), deleteProductFromCart);
Router.route("/:cartId").put(editCart);

module.exports = Router;
