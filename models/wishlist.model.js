const mongoose = require("mongoose");

const wishListItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  option: {
    type: {},
    required: true,
  },
});

const wishListSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [wishListItemSchema],
  },

  { timestamps: true }
);

module.exports = mongoose.model("WishList", wishListSchema);
