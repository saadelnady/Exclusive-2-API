const mongoose = require("mongoose");
const validator = require("validator");
const roles = require("../utils/constants");

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    image: { type: String, default: "uploads/user-default.png" },
    mobilePhone: { type: String, unique: true, required: true },
    address: { type: String, default: "" },
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
    role: { type: String, default: roles.ADMIN },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema);
