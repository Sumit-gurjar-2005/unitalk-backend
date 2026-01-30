const express = require("express");
const connectDB = require("./config/db");
const requestRoutes = require("./routes/request");
const privateChatRoutes = require("./routes/privateChat")
const authRoutes = require("./routes/auth")

const cors = require("cors");  
const app = express();

connectDB();

app.use(express.json());
app.use(cors({
  origin: "*", // dev ke liye
  credentials: true
}));
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/private-chat", privateChatRoutes);
// app.use("/api/logout", authRoutes);


app.use("/uploads", express.static("src/uploads"));

app.get("/", (req, res) => {
  res.send("Trishul Backend OK");
});

module.exports = app;
