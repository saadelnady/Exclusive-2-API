const express = require("express");
const Router = express.Router();
const {
  addCategoryValidation,
  editCategoryValidation,
} = require("../middlewares/categoryValidation");

const {
  getAllSubCategories,
  addSubCategory,
  getSubCategory,
  editSubCategory,
  deleteSubCategory,
} = require("../controller/subCategories.controller");

Router.route("/")
  .get(getAllSubCategories)
  .post(addCategoryValidation(), addSubCategory);

Router.route("/:subCategoryId")
  .get(getSubCategory)
  .put(editCategoryValidation(), editSubCategory)
  .delete(deleteSubCategory);

module.exports = Router;
