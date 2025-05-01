const { validationResult } = require("express-validator");
const asyncWrapper = require("../middlewares/asyncWrapper");
const subCategory = require("../models/subCategory.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const Subcategory = require("../models/subCategory.model");
const Category = require("../models/category.model");

const getAllSubCategories = asyncWrapper(async (req, res, next) => {
  const { limit, page, text } = req.query;
  const skip = (page - 1) * limit;

  const regex = new RegExp(text, "i");

  const subCategories = await subCategory
    .find({ title: regex }, { __v: false })
    .populate("category")
    .limit(limit)
    .skip(skip);

  const allSubCategories = await subCategory.find({}, { __v: false });

  const subCategorieslength = allSubCategories.length;

  if (!subCategories) {
    const error = appError.create(
      "No subcategories to show",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { subCategories, total: subCategorieslength },
  });
});

const addSubCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }
  const categoryId = req.body.category;
  const subCategoryTitle = req.body.title;
  const targetCategory = await Category.findOne({ _id: categoryId });

  if (!targetCategory) {
    return res.json({
      status: httpStatusText.FAIL,
      errors: "Category not found",
    });
  }

  // Check if a subcategory with the same title already exists in the category

  const subCategoryExist = await Subcategory.findOne({
    _id: { $in: targetCategory.subCategories },
    title: subCategoryTitle,
  });
  if (subCategoryExist) {
    const error = appError.create(
      "Subcategory with the same title already exists in the category",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  } else {
    const newSubCategory = new Subcategory({
      title: subCategoryTitle,
      category: categoryId,
    });

    if (req?.file) {
      newSubCategory.image = `uploads/${req?.file?.filename}`;
    }
    // save new subCategory in database
    await newSubCategory.save();
    // Update the category's subCategories array with the new subcategory's ObjectId
    await Category.findByIdAndUpdate(categoryId, {
      $push: { subCategories: newSubCategory._id },
    });
    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      data: { subCategory: newSubCategory },
      message: "subcategory added successfully",
    });
  }
});

const getSubCategory = asyncWrapper(async (req, res, next) => {
  const { subCategoryId } = req.params;
  const targetSubCategory = await Subcategory.findById(subCategoryId).populate(
    "category"
  );
  if (!targetSubCategory) {
    const error = appError.create(
      "Subcategory not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!subCategoryId) {
    const error = appError.create(
      "subCategoryId is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { subCategory: targetSubCategory },
  });
});

const editSubCategory = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ status: httpStatusText.FAIL, errors: { errors } });
  }
  const { subCategoryId } = req.params;

  const targetSubCategory = await Subcategory.findById(subCategoryId);
  if (!targetSubCategory) {
    const error = appError.create(
      "target SubCategory is not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const categoryId = req.body.category;
  const subCategoryTitle = req.body.title;

  const targetCategory = await Category.findOne({ _id: categoryId });

  if (!targetCategory) {
    return res.json({
      status: httpStatusText.FAIL,
      errors: "Category not found",
    });
  }

  // Check if a subcategory with the same title already exists in the category

  const subCategoryExist = await Subcategory.findOne({
    _id: { $in: targetCategory.subCategories },
    title: subCategoryTitle,
  });

  if (subCategoryExist) {
    const error = appError.create(
      "Subcategory with the same title already exists in the category",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const updatedSubCategoryData = {
    title: subCategoryTitle,
    category: categoryId,
  };

  if (req?.file) {
    updatedSubCategoryData.image = `uploads/${req.file.filename}`;
  }

  await Category.findByIdAndUpdate(
    targetSubCategory.category,
    { $pull: { subCategories: subCategoryId } },
    { new: true }
  );

  // Update the subcategory
  const updatedSubCategory = await Subcategory.findByIdAndUpdate(
    subCategoryId,
    { $set: updatedSubCategoryData },
    { new: true }
  ).populate("category");

  // update category with new data
  await Category.findByIdAndUpdate(categoryId, {
    $push: { subCategories: updatedSubCategory },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { subCategory: updatedSubCategory },
    message: "SubCategory updated successfully",
  });
});

const deleteSubCategory = asyncWrapper(async (req, res, next) => {
  const { subCategoryId } = req.params;
  const targetSubCategory = await Subcategory.findById(subCategoryId);
  if (!targetSubCategory) {
    const error = appError.create(
      "category not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  await Subcategory.deleteOne({
    _id: subCategoryId,
  });

  await Category.findByIdAndUpdate(
    targetSubCategory.category,
    { $pull: { subCategories: subCategoryId } },
    { new: true }
  );
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Subcategory deleted Successfully",
    data: { SubCategory: targetSubCategory },
  });
});

module.exports = {
  getAllSubCategories,
  addSubCategory,
  getSubCategory,
  editSubCategory,
  deleteSubCategory,
};
