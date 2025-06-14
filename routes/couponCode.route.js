const express = require("express");
const {
  addCouponCode,
  getSellerCoupons,
} = require("../controller/couponCode.controller");
const alloewdTo = require("../middlewares/alloewdTo");
const { roles } = require("../utils/constants");
const verifyToken = require("../middlewares/verifyToken");
const Router = express.Router();

Router.route("/").post(verifyToken, alloewdTo(roles.SELLER), addCouponCode);
Router.route("/getSellerCoupons/:sellerId").get(
  verifyToken,
  alloewdTo(roles.SELLER),
  getSellerCoupons
);

module.exports = Router;
