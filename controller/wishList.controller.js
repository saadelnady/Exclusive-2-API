const asyncWrapper = require("../middlewares/asyncWrapper");
const WishList = require("../models/wishlist.model");
const Product = require("../models/product.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");

const addToWishList = asyncWrapper(async (req, res, next) => {
  const { userId, productId, optionId } = req.body;

  let wishList = await WishList.findOne({ user: userId });

  if (!wishList) {
    wishList = new WishList({ user: userId });
  }

  const targetProduct = await Product.findById(productId);
  if (!targetProduct) {
    const error = appError.create(
      "Product not found",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const targetOption = targetProduct.options.find(
    (option) => option._id.toString() === optionId
  );

  if (!targetOption) {
    const error = appError.create(
      "product with this color and size not found",
      404,
      httpStatusText.ERROR
    );
    return next(error);
  }

  const existingItemIndex = wishList.products.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.option._id.toString() === optionId
  );

  if (existingItemIndex > -1) {
    const error = appError.create(
      "product already exists in the wishlist",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  } else {
    // لو الproduct مش موجود فى wishlist
    wishList.products.push({
      product: productId,
      option: targetOption,
    });
  }

  await wishList.save();
  const myWishList = await wishList.populate({
    path: "products.product",
    model: "Product",
  });
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { wishList: myWishList },
    message: "Item added to wishList successfully",
  });
});

// ============================================================================
const getWishList = asyncWrapper(async (req, res, next) => {
  const { userId } = req.query;
  if (!userId) {
    const error = appError.create(
      "User ID is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  let targetWishList = await WishList.findOne({ user: userId });

  if (!targetWishList) {
    targetWishList = new WishList({ user: userId });
  }
  let wishList = await targetWishList.products.populate({
    path: "products.product",
    model: "Product",
  });
  wishList.products = wishList.products.filter((item) => item.product !== null);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { wishList },
  });
});

// ============================================================================
const deleteProductFromWishList = asyncWrapper(async (req, res, next) => {
  const { wishListId, productId } = req.query;

  // Find the cart by ID
  const targetWishList = await WishList.findById(wishListId);
  if (!targetWishList) {
    const error = appError.create(
      "WishList not found",
      404,
      httpStatusText.ERROR
    );
    return next(error);
  }

  // Find the product in the cart's products array and remove it
  const productIndex = targetWishList.products.findIndex(
    (product) => product._id.toString() === productId
  );

  if (productIndex === -1) {
    const error = appError.create(
      "Product not found in WishList",
      404,
      httpStatusText.ERROR
    );
    return next(error);
  }

  // Remove the product from the targetWishList
  targetWishList.products.splice(productIndex, 1);

  // Save the updated cart
  await targetWishList.save();

  const wishList = await targetWishList.populate({
    path: "products.product",
    model: "Product",
  });
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Product deleted successfully from your wishList",
    data: { wishList },
  });
});
// ============================================================================

module.exports = {
  addToWishList,
  getWishList,
  deleteProductFromWishList,
};
