const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: {
      type: String,
      default: "uploads/category-default.png",
    },
    subCategories: [{ type: mongoose.Types.ObjectId, ref: "Subcategory" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
