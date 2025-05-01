const multer = require("multer");
const fs = require("fs");
const appError = require("./appError");
const httpStatusText = require("../utils/utils");

const storage = multer.diskStorage({
  // choose file direction based on folderName
  // cb refer to callback
  destination: function (req, file, cb) {
    try {
      fs.readdirSync("./uploads");
      // callback(error , where we saving data)
      cb(null, "uploads");
    } catch (error) {
      fs.mkdirSync("./uploads", null, true);
    }
  },
  filename: function (req, file, cb) {
    const extension = file.mimetype.split("/")[1];

    imageName = `${Date.now()}.${extension}`;

    cb(null, imageName);
  },
});

const fileFilter = (req, file, cb) => {
  // check the type of uploaded file is an image
  const imageType = file.mimetype.split("/")[0];
  if (imageType === "image") {
    return cb(null, true);
  } else {
    return cb(
      appError.create("this file must be an image", 400, httpStatusText.FAIL),
      false
    );
  }
};

module.exports = { fileFilter, storage };
