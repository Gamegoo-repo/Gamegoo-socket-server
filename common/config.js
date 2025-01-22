const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT,
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  SOCKETIO_URL: process.env.SOCKETIO_URL,
  API_SERVER_URL: process.env.API_SERVER_URL,
  NODE_SERVER_URL: process.env.NODE_SERVER_URL,
  EC2_LOG_PATH: process.env.EC2_LOG_PATH || "./logs",
};
