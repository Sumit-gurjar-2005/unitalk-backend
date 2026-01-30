const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },

  name: String,
  gender: String,
  password: String,

  profilePic: {
    type: String,
    default: ""
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  isProfileComplete: {
    type: Boolean,
    default: false
  },

  // 🔽 ADD THESE FIELDS ONLY 🔽

  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  friendRequestsSent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  friendRequestsReceived: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
