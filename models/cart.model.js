const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  option: {
    type: {},
    required: true,
  },
  selectedCount: { type: Number },
  subTotal: { type: Number },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [cartItemSchema],
    totalPriceBeforeDiscount: {
      type: Number,
    },
    totalFinalPrice: {
      type: Number,
    },
    totalDiscount: {
      type: Number,
    },
    paymentMethod: {
      type: String,
    },
    shipping: {
      type: Number,
      default: 50,
    },
    coupon: {
      type: String,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
