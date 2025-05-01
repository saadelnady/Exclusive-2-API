const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const roles = require("../utils/roles");
// const sendToken = require("../utils/sendToken");
const fs = require("fs");

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const { limit, page } = req.query;
  const skip = (page - 1) * limit;
  const users = await User.find({}, { __v: false, password: false })
    .limit(limit)
    .skip(skip);
  if (!users) {
    const error = appError.create(
      "there is n't any user to show",
      404,
      httpStatusText.FAIL
    );
    next(error);
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { users } });
});

const editUser = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    const error = appError.create("user not found", 400, httpStatusText.FAIL);
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
    message: "Profile updated successfully",
  });
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

  const oldUser = await User.findOne({ email: email });

  const mobilePhoneExist = await User.findOne({ mobilePhone: mobilePhone });

  if (mobilePhoneExist) {
    const error = appError.create(
      "mobilePhone already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (oldUser) {
    const error = appError.create(
      "user already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  //genereate token
  const user = {
    firstName,
    lastName,
    email,
    mobilePhone,
    password,
    role: roles.USER,
  };
  const token = generateToken(user);

  const activationUrl = `${process.env.BAIS_URL}/userActivation/${token}`;

  await sendEmail({
    email: user.email,
    subject: "Activate your account",
    message: `Hello ${user.firstName}, please click on the link to activate your account: ${activationUrl}`,
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { token },
    message: `please cheack your email:-${user.email} to activate your account`,
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
    const error = new appError.create(
      "user not found",
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const deletedUser = await User.deleteOne({ _id: req.params.userId });
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { user: deletedUser },
  });
});

const activateUser = asyncWrapper(async (req, res, next) => {
  const { current } = req;
  const hashedPassword = await bcrypt.hash(current.password, 10);

  current.password = hashedPassword;
  const oldUser = await User.findOne({ email: current.email });

  const mobilePhoneExist = await User.findOne({
    mobilePhone: current.mobilePhone,
  });

  if (mobilePhoneExist || oldUser) {
    const error = appError.create(
      "your account already activated ",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const user = await User.create(current);

  // sendToken(current, 201, res);

  res.status(200).json({ data: { currentUser: user } });
});

module.exports = {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  editUser,
  deleteUser,
  activateUser,
};
