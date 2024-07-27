const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || "secret",
  },
  socketioUrl: process.env.SOCKETIO_URL || "/socket.io/socket.io.js",
  apiServerUrl: process.env.APISERVER_URL || "https://api.gamegoo.co.kr",
};
