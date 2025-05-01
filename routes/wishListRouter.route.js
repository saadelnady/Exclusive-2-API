const express = require("express");

const {
  addToWishList,
  getWishList,
  deleteProductFromWishList,
} = require("../controller/wishList.controller.js");

const alloewdTo = require("../middlewares/alloewdTo");
const roles = require("../utils/roles");
const verifyToken = require("../middlewares/verifyToken");

const Router = express.Router();

Router.route("/").post(verifyToken, alloewdTo(roles.USER), addToWishList);
Router.route("/")
  .get(verifyToken, alloewdTo(roles.USER), getWishList)
  .delete(verifyToken, alloewdTo(roles.USER), deleteProductFromWishList);

module.exports = Router;
