const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const PrivateMessage = require("../models/PrivateMessage");
const upload = require("../middlewares/upload");

router.get("/:friendId", auth, async (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.params;

  const messages = await PrivateMessage.find({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
});

module.exports = router;



router.post("/send", auth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;


    if (!receiverId || !message) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const msg = await PrivateMessage.create({
      sender: senderId,
      receiver: receiverId,
      message,
    });

    res.json({
      success: true,
      message: msg,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});




// router.post(
//   "/send-image",
//   auth,
//   upload.single("image"),
//   async (req, res) => {
//     try {
      
// console.log("USER:", req.user);
// console.log("FILE:", req.file);

//       const { receiver } = req.body;

//       const message = await PrivateMessage.create({
//         sender: req.user.id,
//         receiver,
//         image: `/uploads/private/images/${req.file.filename}`,
//       });

//       res.status(201).json({
//         success: true,
//         message,
//       });
//     } catch (err) {
//       res.status(500).json({ success: false });
//     }
//   }
// );
// console.log("✅ private-chat routes loaded");


// ✅ FIXED BACKEND ROUTE - Replace your current route with this

router.post(
  "/send-image",
  auth,
  // upload.single("image"),
  upload.fields([{ name: "image", maxCount: 1 }]),

  async (req, res) => {
    try {
      console.log("=== IMAGE UPLOAD DEBUG ===");
      console.log("USER:", req.user);
      console.log("BODY:", req.body);

      // ✅ Check if file uploaded
     console.log("FILES:", req.files);

if (!req.files || !req.files.image) {
  console.error("❌ No file uploaded");
  return res.status(400).json({
    success: false,
    error: "No file uploaded",
  });
}

const imageFile = req.files.image[0];


      // ✅ Check if user authenticated
      if (!req.user || !req.user.id) {
        console.error("❌ User not authenticated");
        return res.status(401).json({ 
          success: false, 
          error: "Not authenticated" 
        });
      }

      // ✅ Get receiver from receiverId (frontend sends receiverId)
      const receiver = req.body.receiverId || req.body.receiver;

      if (!receiver) {
        console.error("❌ Receiver ID missing");
        return res.status(400).json({ 
          success: false, 
          error: "Receiver ID required" 
        });
      }

      // ✅ Create message
      const message = await PrivateMessage.create({
        sender: req.user.id,
        receiver,
        // image: `/uploads/private/images/${req.file.filename}`,
        image: `/uploads/private/images/${imageFile.filename}`,

        type: "image",
      });

      console.log("✅ Image message created:", message);

      res.status(201).json({
        success: true,
        message: {
          sender: req.user.id,
          receiver,
          image: message.image,
          type: "image",
        },
      });
    } catch (err) {
      console.error("❌ IMAGE SEND ERROR:", err);
      console.error("Error details:", err.message);
      res.status(500).json({ 
        success: false, 
        error: err.message || "Internal server error" 
      });
    }
  }
);

console.log("✅ private-chat routes loaded");