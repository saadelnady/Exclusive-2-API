const mongoose = require("mongoose");
const validator = require("validator");
const { userStatus } = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: function () {
        return `${process.env.BASE_URL}/uploads/user-default.png`;
      },
    },
    mobilePhone: { type: String, unique: true, required: true },
    address: { type: String, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: {
          ar: "البريد الإلكتروني غير صالح",
          en: "Email must be valid email",
        },
      },
    },
    password: {
      type: String,
      required: true,
    },
    token: { type: String },
    cart: [{ type: mongoose.Types.ObjectId, ref: "Cart" }],
    status: {
      type: String,
      default: userStatus.NOTVERIFIED,
      enum: [userStatus.NOTVERIFIED, userStatus.VERIFIED, userStatus.BLOCKED],
    },
    blockReason: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (value && this.status !== userStatus.BLOCKED) {
            return false;
          }
          return true;
        },
        message: "blockReason can only be set when status is BLOCKED",
      },
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
