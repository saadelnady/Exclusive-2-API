const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const Category = require("../models/category.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");

const getAllCategories = asyncWrapper(async (req, res, next) => {
  const { limit, page, text } = req.query;
  const skip = (page - 1) * limit;

  // Constructing the regex to match categories containing the provided text
  const regex = new RegExp(text, "i");

  // Query to find categories with title matching the regex
  const categories = await Category.find({ title: regex }, { __v: false })
    .populate("subCategories")
    .limit(limit)
    .skip(skip);

  // Query to get all categories (for calculating total count)
  const allCategories = await Category.find({}, { __v: false });

  const categoriesLength = allCategories.length;

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { categories, total: categoriesLength },
  });
});

const addCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { title } = req.body;

  const categoryExist = await Category.findOne({
    title: title,
  });
  if (categoryExist) {
    const error = appError.create(
      " category is already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const newCategory = new Category({ ...req.body });
  if (req?.file) {
    newCategory.image = `uploads/${req?.file?.filename}`;
  }
  await newCategory.save();

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { category: newCategory },
    message: "category added Successfully",
  });
});

const getCategory = asyncWrapper(async (req, res, next) => {
  const { categoryId } = req.params;
  const targetCategory = await Category.findById(categoryId).populate(
    "subCategories"
  );
  if (!targetCategory) {
    const error = appError.create(
      "category not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!categoryId) {
    const error = appError.create(
      "categoryId is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { category: targetCategory },
  });
});

const editCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }

  const { categoryId } = req.params;

  const targetCategory = await Category.findById(categoryId);
  if (!targetCategory) {
    const error = appError.create(
      "category not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const options = {
    new: true,
  };

  const { title } = req.body;
  const categoryExist = await Category.findOne({
    title: title,
  });

  if (categoryExist) {
    const error = appError.create(
      "category is already exist",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  let updateFields = { ...req.body };
  if (req.file) {
    updateFields.image = `uploads/${req.file.filename}`;
  }

  const updatedCategory = await Category.findOneAndUpdate(
    { _id: categoryId },
    { $set: updateFields },
    { ...options, new: true }
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { category: updatedCategory },
    message: "category updated Successfully",
  });
});

const deleteCategory = asyncWrapper(async (req, res, next) => {
  const { categoryId } = req.params;
  const targetCategory = await Category.findById(categoryId);
  if (!targetCategory) {
    const error = appError.create(
      "category not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  await Category.deleteOne({ _id: categoryId });
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "category deleted Successfully",
    data: { category: targetCategory },
  });
});

module.exports = {
  getAllCategories,
  addCategory,
  getCategory,
  editCategory,
  deleteCategory,
};
