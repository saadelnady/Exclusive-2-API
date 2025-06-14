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

const Router = express.Router();

Router.route("/")
  .get(getAllCategories)
  .post(addCategoryValidation(), addCategory);
Router.route("/:categoryId")
  .get(getCategory)
  .put(editCategoryValidation(), editCategory)
  .delete(deleteCategory);

module.exports = Router;
