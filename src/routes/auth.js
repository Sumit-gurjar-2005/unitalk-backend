const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const { sendOtp, verifyOtp, completeSignup, login, getUserProfile,updateProfile, logout } = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-signup", completeSignup);
router.post("/login", login);

// Protected routes
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateProfile); 
router.post("/logout", authMiddleware, logout);

module.exports = router;  // ← Ye add karo