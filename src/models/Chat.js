const mongoose = require("mongoose");

// Chat Room Model
const chatRoomSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
}, { timestamps: true });

// Message Model
const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = { ChatRoom, Message };