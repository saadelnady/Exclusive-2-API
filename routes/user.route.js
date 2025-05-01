const express = require("express");
const {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  editUser,
  deleteUser,
  activateUser,
} = require("../controller/user.controller");

const {
  registerValidation,
  loginValidation,
} = require("../middlewares/authValidation");
const verifyToken = require("../middlewares/verifyToken");
const roles = require("../utils/roles");
const alloewdTo = require("../middlewares/alloewdTo");
const {
  editProfileValidation,
} = require("../middlewares/editProfileValidation");

const router = express.Router();

const multer = require("multer");
const { storage, fileFilter } = require("../utils/multer");
const upload = multer({ storage: storage, fileFilter });

router.route("/").get(verifyToken, alloewdTo(roles.ADMIN), getAllUsers);
router.route("/activation").post(verifyToken, activateUser);

router
  .route("/:userId")
  .put(upload.single("image"), editProfileValidation(), editUser)
  .delete(deleteUser);

router.route("/getUserProfile").get(verifyToken, getUserProfile);
router.route("/register").post(registerValidation(), userRegister);
router.route("/login").post(loginValidation(), userLogin);

module.exports = router;
