const mongoose = require("mongoose");
const validator = require("validator");
const roles = require("../utils/roles");

const sellerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    image: { type: String, default: "uploads/seller-default.png" },
    mobilePhone: { type: String, unique: true, required: true },
    address: { type: String },
    email: {
      type: String,
      validator: [validator.isEmail, "Email must be valid email"],
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    token: { type: String },
    role: { type: String, default: roles.SELLER },
    products: [{ type: mongoose.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Seller", sellerSchema);
