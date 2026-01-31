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
    // 🔎 DEBUG (temporary – Render logs me dikhega)
   console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "SET" : "MISSING");


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER, // safest
      to,
      subject: "Your UniTalk OTP",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
    });

    console.log("✅ OTP email sent to:", to);

  } catch (error) {
    console.error("❌ OTP EMAIL ERROR:", error);
    throw error; // important so API knows it failed
  }
};

module.exports = sendEmail;
