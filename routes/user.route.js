const express = require("express");
const {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  editUser,
  deleteUser,
  verifyUser,
  getUser,
  resendVerificationCode,
} = require("../controller/user.controller.js");

const {
  registerValidation,
  loginValidation,
} = require("../middlewares/authValidation");
const verifyToken = require("../middlewares/verifyToken");
const { roles } = require("../utils/constants");
const alloewdTo = require("../middlewares/alloewdTo");
const {
  editProfileValidation,
} = require("../middlewares/editProfileValidation");

const router = express.Router();

router
  .route("/")
  .get(verifyToken, alloewdTo(roles.ADMIN, roles.SUPER_ADMIN), getAllUsers);
router.route("/verify").post(verifyUser);
router.route("/resendVerification").post(resendVerificationCode);

router
  .route("/:userId")
  .get(
    verifyToken,
    alloewdTo(roles.ADMIN, roles.SUPER_ADMIN, roles.USER, roles.SELLER),
    getUser
  )
  .put(
    verifyToken,
    alloewdTo(roles.ADMIN, roles.SUPER_ADMIN, roles.USER),
    editUser
  )
  .delete(deleteUser);

router.route("/getUserProfile").get(verifyToken, getUserProfile);
router.route("/register").post(registerValidation(), userRegister);
router.route("/login").post(loginValidation(), userLogin);

module.exports = router;
