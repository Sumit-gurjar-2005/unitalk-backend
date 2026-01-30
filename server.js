require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const initializeSocket = require("./src/socket");

const PORT = 5000;

// HTTP server create karo
const server = http.createServer(app);

// Socket.io initialize karo
initializeSocket(server);
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

