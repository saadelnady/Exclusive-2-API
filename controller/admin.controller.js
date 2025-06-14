const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const asyncWrapper = require("../middlewares/asyncWrapper");

const Admin = require("../models/admin.model");
const User = require("../models/user.model");
const Seller = require("../models/seller.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");

const moment = require("moment");
require("moment/locale/ar");

const appError = require("../utils/appError");
const { generateToken } = require("../utils/utils");
const mongoose = require("mongoose");
const { httpStatusText, roles } = require("../utils/constants");

const getAllAdmins = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const skip = (page - 1) * limit;

  const searchQuery = {
    role: { $ne: roles.SUPER_ADMIN },
  };

  // Escape special characters in regex
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
      { role: regex },
      {
        _id: mongoose.Types.ObjectId.isValid(text)
          ? new mongoose.Types.ObjectId(text)
          : undefined,
      },
    ].filter(Boolean);
  }

  const [Admins, totalAdminsCount] = await Promise.all([
    Admin.find(searchQuery, { __v: 0, password: 0, token: 0 })
      .limit(limit)
      .skip(skip),
    Admin.countDocuments(searchQuery),
  ]);

  // if (!Admins.length) {
  //   const error = appError.create(
  //     { ar: "لا يوجد مشرفين", en: "There are no admins" },
  //     404,
  //     httpStatusText.FAIL
  //   );
  //   return next(error);
  // }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      admins: Admins,
      total: totalAdminsCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalAdminsCount / limit),
    },
  });
});

const editAdminProfile = asyncWrapper(async (req, res, next) => {
  const { adminId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetAdmin = await Admin.findById(adminId);
  if (!targetAdmin) {
    const error = appError.create(
      { ar: "هذا الحساب  غير موجود", en: "This account does not exist" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const { email, mobilePhone, newPassword, currentPassword } = req.body;

  // Check if the provided email or mobilePhone already exists in the database
  const existingAdmin = await Admin.findOne({
    $or: [{ email: email }, { mobilePhone: mobilePhone }],
    _id: { $ne: adminId }, // Exclude the current admin from the check
  });

  if (existingAdmin) {
    const error = appError.create(
      {
        ar: "البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل",
        en: "Email or mobile phone already exists",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const options = {
    new: true,
  };

  const updatedAdmin = await Admin.findByIdAndUpdate(
    adminId,
    {
      $set: { ...req.body },
    },
    options
  );

  if (newPassword) {
    if (!currentPassword) {
      const error = appError.create(
        {
          ar: " برجاء ادخال كلمة المرور الحالية",
          en: " Please enter your current password",
        },
        400,
        httpStatusText.FAIL
      );
      return next(error);
    }
    const matchedPassword = await bcrypt.compare(
      currentPassword,
      targetAdmin.password
    );
    if (!matchedPassword) {
      const error = appError.create(
        {
          ar: "كلمة المرور الحالية غير صحيحة",
          en: "current password is not correct",
        },
        400,
        httpStatusText.FAIL
      );
      return next(error);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    updatedAdmin.password = hashedNewPassword;
  }

  await updatedAdmin.save();
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { admin: updatedAdmin },
    message: {
      ar: "تم  تعديل الحساب  بنجاح",
      en: "Profile updated successfully",
    },
  });
});

const getAdminProfile = asyncWrapper(async (req, res, next) => {
  const token = req?.current?.token;

  // exclude password and token from the response
  const targetAdmin = await Admin.findOne({ token }).select("-password -token");

  if (!targetAdmin) {
    const error = appError.create(
      { ar: "هذا الحساب  غير موجود", en: "This account does not exist" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { admin: targetAdmin } });
});

const getAdmin = asyncWrapper(async (req, res, next) => {
  const { adminId } = req.params;

  const targetAdmin = await Admin.findOne({ _id: adminId }).select(
    "-password -token"
  );

  if (!targetAdmin) {
    const error = appError.create(
      { ar: "هذا الحساب  غير موجود", en: "This account does not exist" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { admin: targetAdmin } });
});

const adminRegister = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, mobilePhone } = req.body;

  const oldAdmin = await Admin.findOne({ email: email });

  const mobilePhoneExist = await Admin.findOne({ mobilePhone: mobilePhone });

  if (oldAdmin) {
    const error = appError.create(
      { ar: "الادمن موجود بالفعل", en: "Admin already exists" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (mobilePhoneExist) {
    const error = appError.create(
      { ar: "رقم الهاتف موجود بالفعل", en: "Mobile Phone is Already Exist" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  //genereate token
  const admin = {
    firstName,
    lastName,
    email,
    mobilePhone,
    password,
  };
  const token = generateToken(admin);

  const hashedPassword = await bcrypt.hash(password, 10);
  admin.password = hashedPassword;
  admin.token = token;
  const newAdmin = await Admin.create(admin);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { token },
    message: {
      ar: "تم انشاء الحساب بنجاح",
      en: "Account created successfully",
    },
  });
});

const addAdmin = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, mobilePhone, image } = req.body;

  const oldAdmin = await Admin.findOne({ email: email });

  const mobilePhoneExist = await Admin.findOne({ mobilePhone: mobilePhone });

  if (oldAdmin) {
    const error = appError.create(
      { ar: "الادمن موجود بالفعل", en: "Admin already exists" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (mobilePhoneExist) {
    const error = appError.create(
      { ar: "رقم الهاتف موجود بالفعل", en: "Mobile Phone is Already Exist" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  //genereate token
  const admin = {
    firstName,
    lastName,
    email,
    mobilePhone,
    password,
    image,
  };

  const hashedPassword = await bcrypt.hash(password, 10);
  admin.password = hashedPassword;
  const token = generateToken(admin);
  admin.token = token;
  const newAdmin = await Admin.create(admin);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    admin: newAdmin,
    message: {
      ar: "تم انشاء الحساب بنجاح",
      en: "Account created successfully",
    },
  });
});

const adminLogin = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (!admin) {
    const error = appError.create(
      { ar: "البريد الالكتروني غير صحيحة", en: "email is not correct" },
      500,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, admin.password);

  if (!matchedPassword) {
    const error = appError.create(
      { ar: "كلمة المرور غير صحيحة", en: "password is not correct" },
      500,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (admin && matchedPassword) {
    const token = generateToken({
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      mobilePhone: admin.mobilePhone,
      role: admin.role,
    });

    admin.token = token;
    await admin.save();
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { token: admin.token },
      message: { ar: "تم تسجيل الدخول بنجاح", en: "logged in successfully" },
    });
  } else {
    const error = appError.create(
      {
        ar: "البريد الالكتروني او كلمة المرور غير صحيحة",
        en: "email or password is not correct",
      },

      400,
      httpStatusText.ERROR
    );

    return next(error);
  }
});

const deleteAdmin = asyncWrapper(async (req, res, next) => {
  const targetAdmin = await Admin.findOne({ _id: req.params.adminId });

  if (!targetAdmin) {
    const error = appError.create(
      { ar: "هذا الحساب غير موجود", en: "This account does not exist" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (targetAdmin.role === roles.SUPER_ADMIN) {
    const error = appError.create(
      { ar: "لا يمكن حذف هذا الحساب", en: "This account can't be deleted" },
      403,
      httpStatusText.ERROR
    );
    return next(error);
  }

  await Admin.deleteOne({ _id: req.params.adminId });

  // استخرج صفحة وحدد حجم الصفحة من query params، لو مش موجودين افتراضياً:
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [admins, total] = await Promise.all([
    Admin.find(
      { role: { $ne: roles.SUPER_ADMIN } },
      { password: 0, token: 0, __v: 0 }
    )
      .limit(limit)
      .skip(skip),
    Admin.countDocuments({ role: { $ne: roles.SUPER_ADMIN } }),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    admins,
    total,
    currentPage: page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
    message: { ar: "تم حذف الحساب بنجاح", en: "Account deleted successfully" },
  });
});

const blockAdmin = asyncWrapper(async (req, res, next) => {
  const { adminId } = req.params;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetAdmin = await Admin.findById(adminId);
  if (!targetAdmin) {
    const error = appError.create(
      {
        ar: "هذا الحساب غير موجود",
        en: "This account does not exist",
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (targetAdmin && targetAdmin.role === roles.SUPER_ADMIN) {
    const error = appError.create(
      { ar: "لا يمكن حظر هذا الحساب", en: "This account can't be blocked" },
      404,
      httpStatusText.ERROR
    );
    return next(error);
  }
  targetAdmin.isActive
    ? (targetAdmin.isActive = false)
    : (targetAdmin.isActive = true);

  await targetAdmin.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم تحديث حالة الحساب بنجاح",
      en: "Account status updated successfully",
    },
  });
});

const getStatistics = asyncWrapper(async (req, res, next) => {
  const [admins, users, sellers, products, orders] = await Promise.all([
    Admin.find(
      { role: { $ne: roles.SUPER_ADMIN } }, // filter (query)
      { __v: 0, password: 0, token: 0 } // projection
    ),
    User.find({}, { __v: false, password: false, token: false }),
    Seller.find({}, { __v: false }),
    Product.find({}, { __v: false }),
    Order.find({}, { __v: false }),
  ]);

  const now = moment();
  const salesData = [];

  for (let i = 5; i >= 0; i--) {
    const start = moment(now).subtract(i, "months").startOf("month").toDate();
    const end = moment(now).subtract(i, "months").endOf("month").toDate();

    const totalSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    const monthEn = moment(start).locale("en").format("MMMM");
    const monthAr = moment(start).locale("ar").format("MMMM");

    salesData.push({
      name: { ar: monthAr, en: monthEn },
      sales: totalSales[0]?.total || 0,
    });
  }

  const statistics = {
    statisticsData: [
      {
        title: { ar: "المشرفين", en: "Admins" },
        total: admins.length,
      },
      {
        title: { ar: "المستخدمين", en: "Users" },
        total: users.length,
      },
      {
        title: { ar: "البائعين", en: "Sellers" },
        total: sellers.length,
      },
      {
        title: { ar: "المنتجات", en: "Products" },
        total: products.length,
      },
      {
        title: { ar: "الطلبات", en: "Orders" },
        total: orders.length,
      },
    ],
    salesData: {
      title: {
        ar: "مبيعات ال 6 أشهر الأخيرة",
        en: " Sales of the last 6 months",
      },
      data: salesData,
    },
  };

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { statistics },
  });
});
module.exports = {
  getAllAdmins,
  getAdminProfile,
  adminRegister,
  adminLogin,
  editAdminProfile,
  deleteAdmin,
  blockAdmin,
  getStatistics,
  addAdmin,
  getAdmin,
};
