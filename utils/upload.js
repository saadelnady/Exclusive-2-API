const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// تحديد مكان تخزين الملفات المرفوعة
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");

    // التأكد من أن المجلد موجود وإذا لم يكن يتم إنشاؤه
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir); // تحديد المجلد الذي سيتم تخزين الملفات فيه
  },
  filename: function (req, file, cb) {
    // توليد اسم فريد للملف بناءً على الوقت والرقم العشوائي
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // استخراج الامتداد
    cb(null, file.fieldname + "-" + uniqueSuffix + ext); // تحديد اسم الملف
  },
});

// إعداد multer للتعامل مع الملفات المرفوعة
const upload = multer({ storage: storage }).single("image"); // رفع صورة واحدة

// API لرفع الصورة
router.post("/", upload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  // التحقق من نوع الصورة
  if (
    ![".jpg", ".jpeg", ".png", ".gif"].includes(
      path.extname(req.file.originalname).toLowerCase()
    )
  ) {
    return res.status(400).json({ error: "Only image files are allowed!" });
  }

  // بناء الرابط بناءً على مكان تخزين الصور
  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;

  // إرجاع الـ response مع رابط الصورة ومعلوماتها
  return res.status(200).json({
    message: "File uploaded successfully",
    file: {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      url: imageUrl, // رابط الصورة المرفوعة
    },
  });
});

module.exports = router;
