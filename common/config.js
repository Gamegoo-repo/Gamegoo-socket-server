const dotenv = require("dotenv");
dotenv.config();

const JWT_ERR_CODE = [
  "AUTH_401",
  "AUTH_402",
  "AUTH_403",
  "AUTH_404",
  "AUTH_405",
  "AUTH_406",
  "AUTH_407",
  "AUTH_408",
  "AUTH_409",
  "AUTH_410",
  "AUTH_411",
  "AUTH_412",
];

module.exports = {
  port: process.env.PORT,
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  SOCKETIO_URL: process.env.SOCKETIO_URL,
  API_SERVER_URL: process.env.API_SERVER_URL,
  NODE_SERVER_URL: process.env.NODE_SERVER_URL,
  LOG_PATH: "/app/logs" || "./logs",
  JWT_ERR_CODE,
};
