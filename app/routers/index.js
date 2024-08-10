const express = require("express");
const { join } = require("node:path");
const path = require("path");

module.exports = (io) => {
  const router = express.Router();

  const { login } = require("../controller/loginController")(io); // io 객체를 전달
  const { logout } = require("../controller/logoutController")(io);
  const { socketRoomJoin } = require("../controller/socketController")(io);

  router.use("/img", express.static(path.join(__dirname, "../../public/img")));

  router.use("/scripts", express.static(path.join(__dirname, "../../public/scripts")));

  router.post("/login", login);

  router.post("/logout", logout);

  // 8080 -> 3000 으로 보낼 api. 특정 socket을 특정 chatroom에 join시키기
  router.post("/socket/room/join", socketRoomJoin);

  return router;
};
