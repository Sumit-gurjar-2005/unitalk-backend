const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      required: function () {
        return this.type === "text";
      },
    },

    image: {
      type: String,
      default: null
    }


  },
  { timestamps: true }
);

module.exports = mongoose.model("PrivateMessage", privateMessageSchema);
