// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const User = require("./models/User");
// const PrivateMessage = require("./models/PrivateMessage");
// const { ChatRoom, Message } = require("./models/Chat");

// // Waiting users for anonymous match
// const waitingQueue = [];

// // userId -> socketId
// const activeConnections = new Map();

// // userId -> roomId (anonymous)
// const activeChatRooms = new Map();

// const initializeSocket = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   /* ===============================
//      🔐 AUTH
//   =============================== */
//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth.token;
//       if (!token) return next(new Error("No token"));

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.userId).select("-password");
//       if (!user) return next(new Error("User not found"));

//       socket.userId = user._id.toString();
//       socket.userName = user.name;
//       socket.userGender = user.gender;

//       next();
//     } catch (err) {
//       next(new Error("Authentication failed"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log(`✅ Connected: ${socket.userName} (${socket.userId})`);
//     activeConnections.set(socket.userId, socket.id);

//     /* =====================================================
//        🔍 ANONYMOUS MATCH
//     ===================================================== */
//     socket.on("find-match", async () => {
//       if (activeChatRooms.has(socket.userId)) return;

//       let matchedUser = null;
//       let index = -1;

//       const preferredGender =
//         socket.userGender === "Male" ? "Female" : "Male";

//       for (let i = 0; i < waitingQueue.length; i++) {
//         if (
//           waitingQueue[i].gender === preferredGender &&
//           waitingQueue[i].userId !== socket.userId
//         ) {
//           matchedUser = waitingQueue[i];
//           index = i;
//           break;
//         }
//       }

//       if (!matchedUser) {
//         for (let i = 0; i < waitingQueue.length; i++) {
//           if (waitingQueue[i].userId !== socket.userId) {
//             matchedUser = waitingQueue[i];
//             index = i;
//             break;
//           }
//         }
//       }

//       if (matchedUser) {
//         waitingQueue.splice(index, 1);

//         const chatRoom = await ChatRoom.create({
//           user1: socket.userId,
//           user2: matchedUser.userId,
//           isActive: true,
//         });

//         const roomId = chatRoom._id.toString();

//         activeChatRooms.set(socket.userId, roomId);
//         activeChatRooms.set(matchedUser.userId, roomId);

//         socket.join(roomId);
//         const otherSocket = io.sockets.sockets.get(matchedUser.socketId);
//         if (otherSocket) otherSocket.join(roomId);

//         io.to(roomId).emit("match-found", { roomId });
//       } else {
//         waitingQueue.push({
//           userId: socket.userId,
//           socketId: socket.id,
//           gender: socket.userGender,
//         });

//         socket.emit("waiting");
//       }
//     });

//     /* =====================================================
//        💬 ANONYMOUS MESSAGE
//     ===================================================== */
//     socket.on("send-message", async ({ message }) => {
//       const roomId = activeChatRooms.get(socket.userId);
//       if (!roomId) return;

//       const saved = await Message.create({
//         chatRoom: roomId,
//         sender: socket.userId,
//         message,
//       });

//       const chatRoom = await ChatRoom.findById(roomId);
//       const otherUserId =
//         chatRoom.user1.toString() === socket.userId
//           ? chatRoom.user2.toString()
//           : chatRoom.user1.toString();

//       const otherSocketId = activeConnections.get(otherUserId);

//       if (otherSocketId) {
//         io.to(otherSocketId).emit("new-message", {
//           message,
//           isMe: false,
//         });
//       }

//       socket.emit("message-sent", {
//         message,
//         isMe: true,
//       });
//     });

//     /* =====================================================
//        👥 FRIEND REQUEST
//     ===================================================== */
//     socket.on("send-friend-request", async () => {
//       const roomId = activeChatRooms.get(socket.userId);
//       if (!roomId) return;

//       const chatRoom = await ChatRoom.findById(roomId);
//       if (!chatRoom) return;

//       const receiverId =
//         chatRoom.user1.toString() === socket.userId
//           ? chatRoom.user2.toString()
//           : chatRoom.user1.toString();

//       const sender = await User.findById(socket.userId);
//       const receiver = await User.findById(receiverId);

//       if (
//         sender.friendRequestsSent.includes(receiverId) ||
//         receiver.friendRequestsReceived.includes(socket.userId)
//       )
//         return;

//       sender.friendRequestsSent.push(receiverId);
//       receiver.friendRequestsReceived.push(socket.userId);

//       await sender.save();
//       await receiver.save();

//       const receiverSocketId = activeConnections.get(receiverId);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("friend-request-received", {
//           from: socket.userId,
//         });
//       }

//       socket.emit("friend-request-sent");
//     });

//     /* =====================================================
//        💬 PRIVATE CHAT (🔥 NEW)
//     ===================================================== */

//     // Join private chat room
//     socket.on("join-private-chat", ({ friendId }) => {
//       const room = [socket.userId, friendId].sort().join("_");
//       socket.join(room);
//     });

//     // Send private message
//     socket.on("send-private-message", async ({ friendId, message }) => {
//       const room = [socket.userId, friendId].sort().join("_");

//       const saved = await PrivateMessage.create({
//         sender: socket.userId,
//         receiver: friendId,
//         message,
//       });

//       io.to(room).emit("new-private-message", {
//         _id: saved._id,
//         sender: socket.userId,
//         message,
//         createdAt: saved.createdAt,
//       });
//     });

//     /* =====================================================
//        ❌ DISCONNECT
//     ===================================================== */
//     socket.on("disconnect", async () => {
//       console.log(`❌ Disconnected: ${socket.userId}`);

//       // Remove from waiting queue
//       const qIndex = waitingQueue.findIndex(
//         (u) => u.userId === socket.userId
//       );
//       if (qIndex !== -1) waitingQueue.splice(qIndex, 1);

//       const roomId = activeChatRooms.get(socket.userId);
//       if (roomId) {
//         const chatRoom = await ChatRoom.findById(roomId);

//         if (chatRoom && chatRoom.isActive) {
//           chatRoom.isActive = false;
//           await chatRoom.save();

//           const otherUserId =
//             chatRoom.user1.toString() === socket.userId
//               ? chatRoom.user2.toString()
//               : chatRoom.user1.toString();

//           const otherSocketId = activeConnections.get(otherUserId);

//           if (otherSocketId) {
//             io.to(otherSocketId).emit("chat-ended", {
//               reason: "disconnect",
//               message: "User disconnected",
//             });
//           }

//           activeChatRooms.delete(otherUserId);
//           activeChatRooms.delete(socket.userId);
//         }
//       }

//       activeConnections.delete(socket.userId);
//     });

//     //end-chat
//     socket.on("end-chat", async () => {
//       const roomId = activeChatRooms.get(socket.userId);
//       if (!roomId) return;

//       const chatRoom = await ChatRoom.findById(roomId);
//       if (!chatRoom) return;

//       chatRoom.isActive = false;
//       await chatRoom.save();

//       const otherUserId =
//         chatRoom.user1.toString() === socket.userId
//           ? chatRoom.user2.toString()
//           : chatRoom.user1.toString();

//       const otherSocketId = activeConnections.get(otherUserId);

//       if (otherSocketId) {
//         io.to(otherSocketId).emit("chat-ended", {
//           reason: "manual",
//           message: "User ended this chat",
//         });
//       }

//       socket.emit("chat-ended", {
//         reason: "manual",
//         message: "You ended this chat",
//       });

//       activeChatRooms.delete(socket.userId);
//       activeChatRooms.delete(otherUserId);
//     });
//     // after emitting chat-ended

//     // 🔁 auto re-match (other user)
//     const otherSocket = io.sockets.sockets.get(otherSocketId);
//     if (otherSocket) {
//       waitingQueue.push({
//         userId: otherUserId,
//         socketId: otherSocketId,

        
//         gender: otherSocket.userGender,
//       });

//       io.to(otherSocketId).emit("waiting", {
//         message: "Finding new stranger...",
//       });
//     }


//   });

//   return io;
// };

// module.exports = initializeSocket;

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const PrivateMessage = require("./models/PrivateMessage");
const { ChatRoom, Message } = require("./models/Chat");

// Waiting users for anonymous match
const waitingQueue = [];

// userId -> socketId
const activeConnections = new Map();

// userId -> roomId (anonymous)
const activeChatRooms = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  /* ===============================
     🔐 AUTH
  =============================== */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.userId = user._id.toString();
      socket.userName = user.name;
      socket.userGender = user.gender;

      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ Connected: ${socket.userName} (${socket.userId})`);
    activeConnections.set(socket.userId, socket.id);

    /* =====================================================
       🔍 ANONYMOUS MATCH
    ===================================================== */
    socket.on("find-match", async () => {
      if (activeChatRooms.has(socket.userId)) return;

      let matchedUser = null;
      let index = -1;

      const preferredGender =
        socket.userGender === "Male" ? "Female" : "Male";

      for (let i = 0; i < waitingQueue.length; i++) {
        if (
          waitingQueue[i].gender === preferredGender &&
          waitingQueue[i].userId !== socket.userId
        ) {
          matchedUser = waitingQueue[i];
          index = i;
          break;
        }
      }

      if (!matchedUser) {
        for (let i = 0; i < waitingQueue.length; i++) {
          if (waitingQueue[i].userId !== socket.userId) {
            matchedUser = waitingQueue[i];
            index = i;
            break;
          }
        }
      }

      if (matchedUser) {
        waitingQueue.splice(index, 1);

        const chatRoom = await ChatRoom.create({
          user1: socket.userId,
          user2: matchedUser.userId,
          isActive: true,
        });

        const roomId = chatRoom._id.toString();

        activeChatRooms.set(socket.userId, roomId);
        activeChatRooms.set(matchedUser.userId, roomId);

        socket.join(roomId);
        const otherSocket = io.sockets.sockets.get(matchedUser.socketId);
        if (otherSocket) otherSocket.join(roomId);

        io.to(roomId).emit("match-found", { roomId });
      } else {
        waitingQueue.push({
          userId: socket.userId,
          socketId: socket.id,
          gender: socket.userGender,
        });

        socket.emit("waiting");
      }
    });

    /* =====================================================
       💬 ANONYMOUS MESSAGE
    ===================================================== */
    // socket.on("send-message", async ({ message }) => {
    //   const roomId = activeChatRooms.get(socket.userId);
    //   if (!roomId) return;

    //   const saved = await Message.create({
    //     chatRoom: roomId,
    //     sender: socket.userId,
    //     message,
    //   });

    //   const chatRoom = await ChatRoom.findById(roomId);
    //   const otherUserId =
    //     chatRoom.user1.toString() === socket.userId
    //       ? chatRoom.user2.toString()
    //       : chatRoom.user1.toString();

    //   const otherSocketId = activeConnections.get(otherUserId);

    //   if (otherSocketId) {
    //     io.to(otherSocketId).emit("new-message", {
    //       message,
    //       timestamp: saved.sentAt,
    //       isMe: false,
    //     });
    //   }

    //   socket.emit("message-sent", {
    //     message,
    //     timestamp: saved.sentAt,
    //     isMe: true,
    //   });
    // });
socket.on("send-message", async ({ message }) => {

  // 1️⃣ Active anonymous chat DB se nikaalo
  const chatRoom = await ChatRoom.findOne({
    isActive: true,
    $or: [
      { user1: socket.userId },
      { user2: socket.userId }
    ]
  });

  if (!chatRoom) {
    console.log("❌ No active anonymous chat for user", socket.userId);
    return;
  }

  const roomId = chatRoom._id.toString();

  // 2️⃣ Message DB me save karo
  const saved = await Message.create({
    chatRoom: roomId,
    sender: socket.userId,
    message,
  });

  // 3️⃣ ROOM ko emit karo (MOST IMPORTANT)
  io.to(roomId).emit("new-message", {
    message,
    sender: socket.userId,
    timestamp: saved.sentAt,
  });

});

    /* =====================================================
       👥 FRIEND REQUEST
    ===================================================== */
    socket.on("send-friend-request", async () => {
      const roomId = activeChatRooms.get(socket.userId);
      if (!roomId) return;

      const chatRoom = await ChatRoom.findById(roomId);
      if (!chatRoom) return;

      const receiverId =
        chatRoom.user1.toString() === socket.userId
          ? chatRoom.user2.toString()
          : chatRoom.user1.toString();

      const sender = await User.findById(socket.userId);
      const receiver = await User.findById(receiverId);

      if (
        sender.friendRequestsSent.includes(receiverId) ||
        receiver.friendRequestsReceived.includes(socket.userId)
      )
        return;

      sender.friendRequestsSent.push(receiverId);
      receiver.friendRequestsReceived.push(socket.userId);

      await sender.save();
      await receiver.save();

      const receiverSocketId = activeConnections.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("friend-request-received", {
          from: socket.userId,
        });
      }

      socket.emit("friend-request-sent");
    });

    /* =====================================================
       💬 PRIVATE CHAT
    ===================================================== */

    // Join private chat room
    socket.on("join-private-chat", ({ friendId }) => {
      const room = [socket.userId, friendId].sort().join("_");
      socket.join(room);
    });

    // Send private message
    socket.on("send-private-message", async ({ friendId, message }) => {
      const room = [socket.userId, friendId].sort().join("_");

      const saved = await PrivateMessage.create({
        sender: socket.userId,
        receiver: friendId,
        message,
      });

      io.to(room).emit("new-private-message", {
        _id: saved._id,
        sender: socket.userId,
        message,
        createdAt: saved.createdAt,
      });
    });

    /* =====================================================
       🚫 CANCEL SEARCH / LEAVE CHAT
    ===================================================== */
    socket.on("cancel-search", async () => {
      try {
        // Check if user is in waiting queue
        const queueIndex = waitingQueue.findIndex(
          (u) => u.userId === socket.userId
        );

        if (queueIndex !== -1) {
          // User is still searching - just remove from queue
          waitingQueue.splice(queueIndex, 1);
          socket.emit("search-cancelled", { message: "Search cancelled" });
          console.log(`🚫 User ${socket.userId} cancelled search from queue`);
          return;
        }

        // Check if user is already in an active chat
        const roomId = activeChatRooms.get(socket.userId);

        if (roomId) {
          // User is in a chat - end it and notify other user
          const chatRoom = await ChatRoom.findById(roomId);

          if (chatRoom && chatRoom.isActive) {
            chatRoom.isActive = false;
            chatRoom.endedAt = new Date();
            await chatRoom.save();

            const otherUserId =
              chatRoom.user1.toString() === socket.userId
                ? chatRoom.user2.toString()
                : chatRoom.user1.toString();

            // Remove both users from active chats
            activeChatRooms.delete(socket.userId);
            activeChatRooms.delete(otherUserId);

            // Notify other user
            const otherSocketId = activeConnections.get(otherUserId);
            if (otherSocketId) {
              io.to(otherSocketId).emit("stranger-disconnected", {
                message: "Stranger left the chat",
              });

              // Auto add other user to queue for rematch
              const otherSocket = io.sockets.sockets.get(otherSocketId);
              if (otherSocket) {
                waitingQueue.push({
                  userId: otherUserId,
                  socketId: otherSocketId,
                  gender: otherSocket.userGender,
                });
                io.to(otherSocketId).emit("waiting", {
                  message: "Finding new match...",
                });
                console.log(`🔄 Auto-rematch: User ${otherUserId} added to queue`);
              }
            }

            // Notify both that chat ended
            io.to(roomId).emit("chat-ended", { message: "Chat ended" });

            socket.leave(roomId);
            const otherSocket = io.sockets.sockets.get(otherSocketId);
            if (otherSocket) {
              otherSocket.leave(roomId);
            }

            console.log(`🚫 User ${socket.userId} cancelled active chat`);
          }

          socket.emit("search-cancelled", { message: "Chat cancelled" });
        } else {
          console.log(`⚠️ User ${socket.userId} not in queue or chat`);
          socket.emit("search-cancelled", { message: "Nothing to cancel" });
        }
      } catch (error) {
        console.error("CANCEL SEARCH ERROR:", error);
        socket.emit("error", { message: "Failed to cancel" });
      }
    });

    /* =====================================================
       ❌ END CHAT
    ===================================================== */
    socket.on("end-chat", async () => {
      const roomId = activeChatRooms.get(socket.userId);
      if (!roomId) return;

      const chatRoom = await ChatRoom.findById(roomId);
      if (!chatRoom) return;

      chatRoom.isActive = false;
      chatRoom.endedAt = new Date();
      await chatRoom.save();

      const otherUserId =
        chatRoom.user1.toString() === socket.userId
          ? chatRoom.user2.toString()
          : chatRoom.user1.toString();

      const otherSocketId = activeConnections.get(otherUserId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("chat-ended", {
          reason: "manual",
          message: "Stranger ended this chat",
        });

        // 🔁 Auto re-match (other user)
        const otherSocket = io.sockets.sockets.get(otherSocketId);
        if (otherSocket) {
          waitingQueue.push({
            userId: otherUserId,
            socketId: otherSocketId,
            gender: otherSocket.userGender,
          });

          io.to(otherSocketId).emit("waiting", {
            message: "Finding new match...",
          });
          console.log(`🔄 Auto-rematch: User ${otherUserId} added to queue`);
        }
      }

      socket.emit("chat-ended", {
        reason: "manual",
        message: "You ended this chat",
      });

      activeChatRooms.delete(socket.userId);
      activeChatRooms.delete(otherUserId);
    });

    /* =====================================================
       ❌ DISCONNECT
    ===================================================== */
    socket.on("disconnect", async () => {
      console.log(`❌ Disconnected: ${socket.userId}`);

      // Remove from waiting queue
      const qIndex = waitingQueue.findIndex((u) => u.userId === socket.userId);
      if (qIndex !== -1) {
        waitingQueue.splice(qIndex, 1);
        console.log(`🗑️ Removed ${socket.userId} from queue`);
      }

      const roomId = activeChatRooms.get(socket.userId);
      if (roomId) {
        const chatRoom = await ChatRoom.findById(roomId);

        if (chatRoom && chatRoom.isActive) {
          chatRoom.isActive = false;
          chatRoom.endedAt = new Date();
          await chatRoom.save();

          const otherUserId =
            chatRoom.user1.toString() === socket.userId
              ? chatRoom.user2.toString()
              : chatRoom.user1.toString();

          const otherSocketId = activeConnections.get(otherUserId);

          if (otherSocketId) {
            io.to(otherSocketId).emit("stranger-disconnected", {
              message: "Stranger disconnected",
            });

            // 🔁 Auto re-match (other user)
            const otherSocket = io.sockets.sockets.get(otherSocketId);
            if (otherSocket) {
              waitingQueue.push({
                userId: otherUserId,
                socketId: otherSocketId,
                gender: otherSocket.userGender,
              });

              io.to(otherSocketId).emit("waiting", {
                message: "Finding new match...",
              });
              console.log(`🔄 Auto-rematch: User ${otherUserId} added to queue`);
            }
          }

          activeChatRooms.delete(otherUserId);
          activeChatRooms.delete(socket.userId);
        }
      }

      activeConnections.delete(socket.userId);
    });
  });

  return io;
};

module.exports = initializeSocket;