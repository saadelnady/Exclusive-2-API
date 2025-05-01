const express = require("express");

const {
  addCategoryValidation,
  editCategoryValidation,
} = require("../middlewares/categoryValidation");

const {
  getAllCategories,
  addCategory,
  getCategory,
  editCategory,
  deleteCategory,
} = require("../controller/category.controller");

const multer = require("multer");
const { storage, fileFilter } = require("../utils/multer");

const upload = multer({ storage: storage, fileFilter });

const Router = express.Router();

Router.route("/")
  .get(getAllCategories)
  .post(upload.single("image"), addCategoryValidation(), addCategory);
Router.route("/:categoryId")
  .get(getCategory)
  .put(upload.single("image"), editCategoryValidation(), editCategory)
  .delete(deleteCategory);

module.exports = Router;
