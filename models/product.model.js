const mongoose = require("mongoose");
const productStatus = require("../utils/productStatus");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String] },
    category: { type: mongoose.Types.ObjectId, ref: "Category" },
    subCategory: { type: mongoose.Types.ObjectId, ref: "Subcategory" },
    productOwner: { type: mongoose.Types.ObjectId, ref: "Seller" },
    options: [
      {
        size: { type: String, required: true },
        color: { type: String, required: true },
        stockCount: {
          type: Number,
          required: [true, "Please enter your product stock count"],
        },
        price: {
          priceBeforeDiscount: { type: Number, required: true },
          discountPercentage: { type: Number, default: 0 },
          discountValue: { type: Number, default: 0 },
          finalPrice: { type: Number, required: true },
        },
        soldOut: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: [
        productStatus.ACCEPTED,
        productStatus.BLOCKED,
        productStatus.PENDING,
      ],
      default: productStatus.PENDING,
    },
    isFlashSale: { type: Boolean, default: false },
    flashSaleStatus: {
      type: String,
      enum: ["upcoming", "Running", "ended"],
    },
    flashSaleStartDate: { type: Date },
    flashSaleEndDate: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook to set default value for flashSaleStatus
productSchema.pre("save", function (next) {
  if (this.isFlashSale && !this.flashSaleStatus) {
    this.flashSaleStatus = "Running"; // Set default value if isFlashSale is true and flashSaleStatus is not set
  }
  next();
});
module.exports = mongoose.model("Product", productSchema);
