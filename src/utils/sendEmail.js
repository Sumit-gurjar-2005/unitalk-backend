const nodemailer = require("nodemailer");

const sendEmail = async (to, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  await transporter.sendMail({
    from: `"UniTalk OTP" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your UniTalk OTP",
    text: `Your OTP is ${otp}. Valid for 5 minutes.`
  });
};

module.exports = sendEmail;
