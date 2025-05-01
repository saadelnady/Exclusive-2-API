const nodeMailer = require("nodemailer");

const sendEmail = async (options) => {
  // User who sends the email
  const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    // TLS configuration
    secure: true, // Use TLS
    tls: {
      // Reject unauthorized connections
      rejectUnauthorized: false, // Set to true in production with valid certificates
    },
  });

  // User who receives the email
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
