const express = require("express");
const { join } = require("node:path");
const path = require("path");

module.exports = (io) => {
  const router = express.Router();

  const { login } = require("../controller/loginController")(io); // io 객체를 전달
  const { logout } = require("../controller/logoutController")(io);
  const { socketRoomJoin, emitSystemMessage } = require("../controller/socketController")(io);
  const { countUsersInMatching, countUsersInMatchingByTier } = require("../controller/systemMessageController")(io);

  router.use("/img", express.static(path.join(__dirname, "../../public/img")));

  router.use("/scripts", express.static(path.join(__dirname, "../../public/scripts")));

  router.post("/login", login);

  router.post("/logout", logout);

  // (#10-5) 8080 -> 3000 으로 보낼 api. 특정 socket을 특정 chatroom에 join시키기
  router.post("/socket/room/join", socketRoomJoin);

  // 8080 -> 3000 으로 보낼 api. 특정 memberId를 갖는 socket 모두에게 시스템 메시지 event emit
  router.post("/socket/sysmessage", emitSystemMessage);

  // 시스템 메시지 1. 지금 몇 명이 매칭을 기다리고 있는지
  router.get('/socket/message',countUsersInMatching);

  // 시스템 메시지 2. 나와 같은 티어의 n 명이 매칭 중인지 -> 룸에 속한 티어를 돌면서 나랑 같은 애를 찾고,
  router.get('/socket/message/tier',countUsersInMatchingByTier);

  return router;
};
