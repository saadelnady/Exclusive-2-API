const express = require("express");
const {
  registerValidation,
  loginValidation,
} = require("../middlewares/authValidation");
const {
  sellerRegister,
  activateSeller,
  sellerLogin,
  getSeller,
  editSeller,
  getSellerProducts,
  getAllSellers,
  deleteSeller,
  getSellerProfile,
} = require("../controller/seller.controller");

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

router
  .route("/")
  .get(verifyToken, alloewdTo(roles.ADMIN, roles.SUPER_ADMIN), getAllSellers);
router.route("/register").post(registerValidation(), sellerRegister);
router.route("/login").post(loginValidation(), sellerLogin);
router.route("/activation").post(verifyToken, activateSeller);

router.route("/getSellerProfile").get(verifyToken, getSellerProfile);

router.route("/getSellerProducts").get(getSellerProducts);

router
  .route("/:sellerId")
  .get(getSeller)
  .delete(verifyToken, alloewdTo(roles.ADMIN, roles.SUPER_ADMIN), deleteSeller);

router
  .route("/:sellerId")
  .put(
    verifyToken,
    upload.single("image"),
    editProfileValidation(),
    editSeller
  );
module.exports = router;
