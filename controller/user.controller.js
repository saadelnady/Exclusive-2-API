const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const { httpStatusText, userStatus } = require("../utils/constants");
const { generateToken, generateVerificationCode } = require("../utils/utils");
const { sendEmail } = require("../utils/utils");

// const sendToken = require("../utils/sendToken");
const fs = require("fs");
const mongoose = require("mongoose");
const { getImageFullPath } = require("../utils/utils");
const getAllUsers = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const skip = (page - 1) * limit;

  const searchQuery = {};

  const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { mobilePhone: regex },
      { address: regex },

      {
        _id: mongoose.Types.ObjectId.isValid(text)
          ? new mongoose.Types.ObjectId(text)
          : undefined,
      },
    ].filter(Boolean);
  }

  const [users, totalUsersCount] = await Promise.all([
    User.find(searchQuery, { __v: 0, password: 0 }).limit(limit).skip(skip),
    User.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      users,
      total: totalUsersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalUsersCount / limit),
    },
  });
});

const editUser = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    const error = appError.create(
      { ar: "هذا المستخدم غير موجود", en: "User not found" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const { email, mobilePhone, newPassword, currentPassword } = req.body;

  // Check if the provided email or mobilePhone already exists in the database
  const existingUser = await User.findOne({
    $or: [{ email: email }, { mobilePhone: mobilePhone }],
    _id: { $ne: userId }, // Exclude the current user from the check
  });

  if (existingUser) {
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

  const options = {
    new: true,
  };

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: { ...req.body },
    },
    options
  );

  if (newPassword && currentPassword) {
    const matchedPassword = await bcrypt.compare(
      currentPassword,
      targetUser.password
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
    updatedUser.password = hashedNewPassword;
  }

  if (req?.file?.filename) {
    updatedUser.image = `uploads/${req?.file?.filename}`;
  }
  await updatedUser.save();
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { user: updatedUser },
    message: {
      ar: "تم تعديل الحساب بنجاح",
      en: "Account updated successfully",
    },
  });
});

const getUser = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const targetUser = await User.findById(userId, {
    password: 0,
    __v: 0,
    token: 0,
  });
  if (!targetUser) {
    const error = appError.create(
      {
        ar: "المستخدم غير موجود",
        en: "User not found",
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }
  targetUser.image = getImageFullPath(targetUser?.image);
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { user: targetUser } });
});

const getUserProfile = asyncWrapper(async (req, res, next) => {
  const token = req?.current?.token;
  const targetUser = await User.findOne({ token: token });
  if (!targetUser) {
    const error = appError.create("user not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { user: targetUser } });
});

const userRegister = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, mobilePhone } = req.body;

  const existingEmail = await User.findOne({ email });
  const existingPhone = await User.findOne({ mobilePhone });

  if (existingEmail) {
    const error = appError.create(
      { ar: "المستخدم موجود بالفعل", en: "User already exists" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (existingPhone) {
    const error = appError.create(
      { ar: "رقم الجوال موجود بالفعل", en: "Mobile Phone is Already Exist" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق

  const hashedPassword = await bcrypt.hash(password, 10);

  await sendEmail({
    email,
    subject: "Your Verification Code",
    message: `Your verification code is: ${verificationCode} Please use this code to activate your account.`,
  });

  await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    mobilePhone,
    verificationCode,
    verificationCodeExpires,
    status: userStatus.NOTVERIFIED,
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: `تم تسجيل الحساب بنجاح. برجاء التحقق من بريدك الإلكتروني ${email} لتفعيل الحساب.`,
  });
});

const verifyUser = asyncWrapper(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return next(
      appError.create(
        {
          ar: "يجب إدخال البريد الإلكتروني وكود التحقق",
          en: "Email and verification code are required",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      appError.create(
        { ar: "المستخدم غير موجود", en: "User not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (user.status === userStatus.VERIFIED) {
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "الحساب مفعل بالفعل",
    });
  }

  if (
    user.verificationCode !== verificationCode ||
    user.verificationCodeExpires < Date.now()
  ) {
    return next(
      appError.create(
        {
          ar: "كود التحقق غير صالح أو منتهي الصلاحية",
          en: "Invalid or expired verification code",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  // تحديث حالة المستخدم
  user.status = userStatus.VERIFIED;
  user.verificationCode = "";
  user.verificationCodeExpires = "";
  await user.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم التحقق من الحساب بنجاح",
      en: "Account verified successfully",
    },
  });
});

const resendVerificationCode = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(
      appError.create(
        { ar: "يرجى إدخال البريد الإلكتروني", en: "Email is required" },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      appError.create(
        { ar: "المستخدم غير موجود", en: "User not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (user.status === userStatus.VERIFIED) {
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: {
        ar: "الحساب مفعل بالفعل",
        en: "Account is already verified",
      },
    });
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpires = Date.now() + 10 * 60 * 1000;

  await sendEmail({
    email: user.email,
    subject: "Your Verification Code",
    message: `Your verification code is: ${verificationCode} Please use this code to activate your account.`,
  });

  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم ارسال كود التحقق  مرة أخرى",
      en: "Verification code sent again successfully",
    },
  });
});

const userLogin = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    const error = appError.create("email not found", 500, httpStatusText.FAIL);
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, user.password);

  if (user && matchedPassword) {
    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    user.token = token;
    await user.save();
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { token: user.token },
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

const deleteUser = asyncWrapper(async (req, res, next) => {
  const targetUser = await User.findOne({ _id: req.params.userId });

  if (!targetUser) {
    const error = appError.create(
      { ar: "هذا المستخدم غير موجود", en: "User not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  await User.deleteOne({ _id: req.params.userId });

  // استخرج صفحة وحدد حجم الصفحة من query params، لو مش موجودين افتراضياً:
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({}, { password: 0, __v: 0 }).limit(limit).skip(skip),
    User.countDocuments(),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    users,
    total,
    currentPage: page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
    message: { ar: "تم حذف المستخدم بنجاح", en: "User deleted successfully" },
  });
});

module.exports = {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  editUser,
  deleteUser,
  verifyUser,
  resendVerificationCode,
  getUser,
};
