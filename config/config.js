const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || "jwttttttttttttttsecrettttttttttttttt",
  },
  socketioUrl: process.env.SOCKETIO_URL || "/socket.io/socket.io.js",
  apiServerUrl: process.env.API_SERVER_URL || "http://localhost:8080",
  nodeServerUrl: process.env.NODE_SERVER_URL || "http://localhost:3000",
};
