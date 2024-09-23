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

  // 시스템 메시지 : 지금 몇 명이 매칭을 기다리고 있는지
  // 엔드포인트 뒤에 query로 tier 붙이면 각 티어마다 몇 명 있는지 조회
  // ex) /socket/message?tier=BRONZE 
  router.get('/socket/message',countUsersInMatching);


  return router;
};
