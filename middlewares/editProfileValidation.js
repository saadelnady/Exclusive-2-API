const { body } = require("express-validator");

const editProfileValidation = () => {
  return [
    body("firstName").optional().isLength({ min: 3, max: 20 }).withMessage({
      ar: "يجب أن يكون الاسم الأول بين 3 و 20 حرفًا",
      en: "First name must be between 3 and 20 characters",
    }),

    body("lastName").optional().isLength({ min: 3, max: 20 }).withMessage({
      ar: "يجب أن يكون اسم العائلة بين 3 و 20 حرفًا",
      en: "Last name must be between 3 and 20 characters",
    }),

    body("email").optional().isEmail().withMessage({
      ar: "يرجى إدخال بريد إلكتروني صالح",
      en: "Please provide a valid email",
    }),

    body("mobilePhone").optional().isMobilePhone("any").withMessage({
      ar: "رقم الهاتف غير صالح",
      en: "Invalid mobile phone number",
    }),

    body("address").optional().isLength({ min: 5, max: 100 }).withMessage({
      ar: "يجب أن يكون العنوان بين 5 و 100 حرف",
      en: "Address must be between 5 and 100 characters",
    }),

    body("currentPassword")
      .optional()
      .isLength({ min: 9, max: 25 })
      .withMessage({
        ar: "يجب أن تتراوح كلمة المرور الحالية بين 9 و 25 حرفًا",
        en: "Current password must be between 9 and 25 characters",
      }),

    body("newPassword").optional().isLength({ min: 9, max: 25 }).withMessage({
      ar: "يجب أن تتراوح كلمة المرور الجديدة بين 9 و 25 حرفًا",
      en: "New password must be between 9 and 25 characters",
    }),
  ];
};

module.exports = { editProfileValidation };
