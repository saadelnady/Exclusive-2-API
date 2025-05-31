const express = require("express");
const {
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
} = require("../controller/admin.controller");

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

router
  .route("/all-admins")
  .get(verifyToken, alloewdTo(roles.SUPER_ADMIN), getAllAdmins);
router
  .route("/all-admins")
  .post(
    verifyToken,
    alloewdTo(roles.SUPER_ADMIN),
    registerValidation(),
    addAdmin
  );
router
  .route("/blockAdmin/:adminId")
  .put(verifyToken, alloewdTo(roles.SUPER_ADMIN), blockAdmin);

router.route("/getProfile").get(verifyToken, getAdminProfile);
router
  .route("/statistics")
  .get(verifyToken, alloewdTo(roles.ADMIN, roles.SUPER_ADMIN), getStatistics);

router
  .route("/:adminId")
  .get(verifyToken, getAdmin)
  .put(editProfileValidation(), editAdminProfile)
  .delete(verifyToken, alloewdTo(roles.SUPER_ADMIN), deleteAdmin);

router.route("/register").post(registerValidation(), adminRegister);
router.route("/login").post(loginValidation(), adminLogin);

module.exports = router;
