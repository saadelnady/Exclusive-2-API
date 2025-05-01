const { validationResult } = require("express-validator");

const asyncWrapper = require("../middlewares/asyncWrapper");
const CouponCode = require("../models/couponCode.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const roles = require("../utils/roles");

// add seller coupon
const addCouponCode = asyncWrapper(async (req, res, next) => {
  const { title } = req.body;

  const couponCodeExists = await CouponCode.findOne({ title });
  if (couponCodeExists) {
    const error = appError.create(
      "Coupon code is already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const newCouponCode = new CouponCode({ ...req.body });

  await newCouponCode.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { couponCode: newCouponCode },
    message: "Coupon code created Successfully",
  });
});

// get seller coupons
const getSellerCoupons = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;
  if (!sellerId) {
    const error = appError.create(
      "sellerId is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const sellerCoupons = await CouponCode.find({
    couponCodeOwner: sellerId,
  }).populate("selectedProduct");
  
  if (!sellerCoupons) {
    const error = appError.create(
      "There is no coupons to show",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { coupons: sellerCoupons },
  });
});
// get seller coupons

module.exports = {
  addCouponCode,
  getSellerCoupons,
};
