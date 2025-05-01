const mongoose = require("mongoose");

const couponCodeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "please enter your coupon code title"],
      unique: true,
    },
    value: { type: Number, required: true },
    minAmount: { type: Number },
    maxAmount: { type: Number },
    selectedProduct: { type: mongoose.Types.ObjectId, ref: "Product" },

    couponCodeOwner: {
      type: mongoose.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CouponCode", couponCodeSchema);
