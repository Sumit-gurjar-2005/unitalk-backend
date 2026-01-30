const Otp = require("../models/Otp");
const User = require("../models/User");
const validateEmail = require("../utils/emailValidator");
const generateOTP = require("../utils/otpGenerator");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Email received:", email);

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid college email" });
    }

    // Check if user already exists with complete profile
    const existingUser = await User.findOne({ email, isProfileComplete: true });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered. Please login instead." });
    }

    const otp = generateOTP();

    await Otp.deleteMany({ email });
    const saved = await Otp.create({ email, otp });

    await sendEmail(email, otp);

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.log("SEND OTP ERROR:", error);
    res.status(500).json({ message: "OTP send failed" });
  }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email, otp });
    

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ email });

    // Save verified email permanently in User model
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({
        email,
        isEmailVerified: true,
        isProfileComplete: false
      });
    } else {
      user.isEmailVerified = true;
      await user.save();
    }

    res.json({ 
      message: "Email verified successfully",
      email: user.email
    });
  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// COMPLETE SIGNUP
exports.completeSignup = async (req, res) => {
  try {
    const { email, name, gender, password, profilePic } = req.body;

    // Find user with verified email
    const user = await User.findOne({ email, isEmailVerified: true });
    
    if (!user) {
      return res.status(400).json({ message: "Email not verified" });
    }

    if (user.isProfileComplete) {
      return res.status(400).json({ message: "Profile already completed" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Complete profile
    user.name = name;
    user.gender = gender;
    user.password = hashedPassword;
    user.profilePic = profilePic || "";
    user.isProfileComplete = true;
    
    await user.save();

    res.status(200).json({ 
      message: "Signup completed successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.log("COMPLETE SIGNUP ERROR:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};
// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if profile is complete
    if (!user.isProfileComplete) {
      return res.status(400).json({ message: "Please complete your signup first" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ message: "Login failed" });
  }
};
// GET USER PROFILE
exports.getUserProfile = async (req, res) => {
  try {
    // req.user will be set by auth middleware
    const user = await User.findById(req.user.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        profilePic: user.profilePic,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.log("GET USER PROFILE ERROR:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// LOGOUT (Token-based - client side handles token removal)
exports.logout = async (req, res) => {
  try {
    // In JWT-based auth, logout is handled client-side by removing the token
    // But we can still have this endpoint for consistency and future blacklisting
    
    res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (error) {
    console.log("LOGOUT ERROR:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};
// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, gender, profilePic } = req.body;
    
    // Find user
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (profilePic !== undefined) user.profilePic = profilePic; // Allow empty string
    
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Profile update failed" });
  }
};