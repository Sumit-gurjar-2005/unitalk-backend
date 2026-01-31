// const nodemailer = require("nodemailer");

// const sendEmail = async (to, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     }
//   });

//   await transporter.sendMail({
//     from: `"UniTalk OTP" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: "Your UniTalk OTP",
//     text: `Your OTP is ${otp}. Valid for 5 minutes.`
//   });
// };

// module.exports = sendEmail;
const nodemailer = require("nodemailer");

const sendEmail = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"UniTalk OTP" <${process.env.SMTP_USER}>`,
      to,
      subject: "Your UniTalk OTP",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
    });

    console.log("✅ OTP mail sent to", to);

  } catch (err) {
    console.error("❌ MAIL ERROR:", err);
    throw err;
  }
};

module.exports = sendEmail;
