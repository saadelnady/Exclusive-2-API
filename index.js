if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config();
}

const cors = require("cors");
const path = require("path");

// Routers
const adminRouter = require("./routes/admin.route");
const userRouter = require("./routes/user.route");
const productRouter = require("./routes/product.route");
const sellerRouter = require("./routes/seller.route");
const categoryRouter = require("./routes/category.route");
const subCategoriesRouter = require("./routes/subCategory.route");
const couponCodeRouter = require("./routes/couponCode.route");
const cartRouter = require("./routes/cart.route");
const wishListRouter = require("./routes/wishListRouter.route.js");

const uploadRouter = require("./utils/upload");
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();

const dbConnection = require("./db/dataBase");
const errorHandler = require("./middlewares/errorHandler");

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.set("trust proxy", true);

// to preview image
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/upload", uploadRouter);

app.use("/api/admin", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/sellers", sellerRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/subCategories", subCategoriesRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishList", wishListRouter);
app.use("/api/couponCode", couponCodeRouter);

// wild card
app.all("*", (req, res, next) => {
  res.status(400).json({ message: "not found your request" });
});
// handle errors
app.use(errorHandler);
// server running
app.listen(process.env.PORT, () => {
  console.log("server is listening on port ", process.env.PORT);
});
dbConnection();
