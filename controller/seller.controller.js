const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const asyncWrapper = require("../middlewares/asyncWrapper");
const Seller = require("../models/seller.model");
const appError = require("../utils/appError");
const { generateToken } = require("../utils/utils");
const { sendEmail } = require("../utils/utils");
const fs = require("fs");
const { productStatus, httpStatusText, roles } = require("../utils/constants");

const sellerRegister = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { firstName, lastName, email, mobilePhone, password } = req.body;

  const emailExist = await Seller.findOne({ email: email });
  const mobilePhoneExist = await Seller.findOne({ mobilePhone: mobilePhone });

  if (emailExist) {
    const error = appError.create(
      "user already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (mobilePhoneExist) {
    const error = appError.create(
      "Mobile Phone is Already Exist",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  //genereate token
  const seller = {
    firstName,
    lastName,
    email,
    mobilePhone,
    password,
    role: roles.SELLER,
  };
  const token = generateToken(seller);

  const activationUrl = `${process.env.BASE_URL}/sellerActivation/${token}`;

  await sendEmail({
    email: seller.email,
    subject: "Activate your seller account",
    message: `Hello ${seller.firstName}, please click on the link to activate your seller account: ${activationUrl}`,
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { token },
    message: `please cheack your email:-${seller.email} to activate your account`,
  });
});

const activateSeller = asyncWrapper(async (req, res, next) => {
  const { current } = req;
  const hashedPassword = await bcrypt.hash(current?.password, 10);

  current.password = hashedPassword;
  const oldSeller = await Seller.findOne({ email: current.email });

  const mobilePhoneExist = await Seller.findOne({
    mobilePhone: current.mobilePhone,
  });

  if (mobilePhoneExist || oldSeller) {
    const error = appError.create(
      "your account already activated ",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const seller = await Seller.create(current);

  // sendToken(current, 201, res);

  res.status(200).json({ data: { currentSeller: seller } });
});
const sellerLogin = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  const { email, password } = req.body;

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetSeller = await Seller.findOne({ email });

  if (!targetSeller) {
    const error = appError.create("email not found", 500, httpStatusText.FAIL);
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, targetSeller.password);

  if (targetSeller && matchedPassword) {
    const token = generateToken({
      id: targetSeller._id,
      role: targetSeller.role,
    });
    targetSeller.token = token;
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { token: targetSeller.token },
      message: "logged in successfully",
    });
  } else {
    const error = appError.create(
      "something wrong email or password is not correct",
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }
});

const getSeller = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;
  const targetSeller = await Seller.findById(sellerId, {
    password: false,
  });

  if (!targetSeller) {
    const error = appError.create(
      "seller not found",
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { seller: targetSeller } });
});

const getSellerProducts = asyncWrapper(async (req, res, next) => {
  const { sellerId, status } = req.query;

  const targetStatus = [
    productStatus.ACCEPTED,
    productStatus.BLOCKED,
    productStatus.PENDING,
  ].includes(status);

  const targetSeller = await Seller.findById(sellerId, {
    password: false,
  }).populate({
    path: "products",
    match: { status: { $in: status } }, // Filter products by status
  });

  if (!targetSeller) {
    const error = appError.create("Seller not found", 404, NOT_FOUND);
    return next(error);
  }
  if (!targetStatus) {
    const error = appError.create("target status not found", 404, NOT_FOUND);
    return next(error);
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      products: targetSeller.products,
      total: targetSeller.products.length,
    },
  });
});

const getAllSellers = asyncWrapper(async (req, res, next) => {
  const query = req.query;

  const limit = query.limit;
  const page = query.page;
  const skip = (page - 1) * limit;
  let sellers = await Seller.find({}, { __v: false, password: false })
    .limit(limit)
    .skip(skip);
  if (!sellers) {
    const error = appError.create(
      "sellers not found",
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }

  res.status(200).json({ status: httpStatusText.SUCCESS, data: { sellers } });
});

const deleteSeller = asyncWrapper(async (req, res, next) => {
  const sellerId = req.params.id;
  const targetSeller = await Seller.findById(sellerId);
  if (!targetSeller) {
    const error = appError.create("Seller not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  const options = { new: true };

  const deletedSeller = await Seller.findByIdAndDelete(sellerId);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { seller: deletedSeller },
    message: "Account deleted successfully",
  });
});

const editSeller = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const targetSeller = await Seller.findById(sellerId);
  if (!targetSeller) {
    const error = appError.create("Seller not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  const { email, mobilePhone, newPassword, currentPassword } = req.body;

  // Check if the provided email or mobilePhone already exists in the database
  const existingSeller = await Seller.findOne({
    $or: [{ email: email }, { mobilePhone: mobilePhone }],
    _id: { $ne: sellerId }, // Exclude the current Seller from the check
  });

  if (existingSeller) {
    const fileName = req?.file?.filename;
    const filePath = `uploads/${fileName}`;
    fs.unlink(filePath, (err) => {
      if (err) {
        res.status(500).json({
          message: "error deleting file",
        });
      }
    });
    const error = appError.create(
      "Email or mobile phone already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const options = { new: true };

  const updatedSeller = await Seller.findByIdAndUpdate(
    sellerId,
    { $set: { ...req.body } },
    options
  );

  if (newPassword && currentPassword) {
    const matchedPassword = await bcrypt.compare(
      currentPassword,
      targetSeller.password
    );
    if (!matchedPassword) {
      const error = appError.create(
        "current password is not correct ",
        400,
        httpStatusText.FAIL
      );
      return next(error);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    updatedSeller.password = hashedNewPassword;
  }

  if (req?.file?.filename) {
    updatedSeller.image = `uploads/${req?.file?.filename}`;
  }
  await updatedSeller.save();
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { seller: updatedSeller },
    message: "Profile updated successfully",
  });
});

const getSellerProfile = asyncWrapper(async (req, res, next) => {
  const sellerId = req.current.id;

  const targetSeller = await Seller.findById(sellerId, {
    password: false,
  });

  if (!targetSeller) {
    const error = appError.create(
      "seller not found",
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { seller: targetSeller } });
});

module.exports = {
  sellerRegister,
  sellerLogin,
  getSeller,
  editSeller,
  getAllSellers,
  deleteSeller,
  getSellerProfile,
  getSellerProducts,
  activateSeller,
};
