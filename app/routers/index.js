const express = require("express");
const path = require("path");

module.exports = (io) => {
  const router = express.Router();

  const { login } = require("../controller/loginController")(io); // io 객체를 전달
  const { logout } = require("../controller/logoutController")(io);
  const { socketRoomJoin, emitSystemMessage } = require("../controller/socketController")(io);
  const { countUsersInMatching } = require("../controller/systemMessageController")(io);
  const { emitFriendOnline } = require("../controller/FriendOnlineController")(io);

  router.use("/img", express.static(path.join(__dirname, "../../public/img")));

  router.use("/scripts", express.static(path.join(__dirname, "../../public/scripts")));

  router.post("/login", login);

  router.post("/logout", logout);

  // (#10-5) 8080 -> 3000 으로 보낼 api. 특정 socket을 특정 chatroom에 join시키기
  router.post("/internal/socket/room/join", socketRoomJoin);

  // 8080 -> 3000 으로 보낼 api. 특정 memberId를 갖는 socket 모두에게 시스템 메시지 event emit
  router.post("/internal/socket/sysmessage", emitSystemMessage);

  // 8080 -> 3000으로 보낼 api. 특정 memberId와 targetMemberId 사이 friend-online event emit
  router.post("/internal/socket/friend/online/:memberId", emitFriendOnline);

  // 시스템 메시지 : 지금 몇 명이 매칭을 기다리고 있는지
  // 엔드포인트 뒤에 query로 tier 붙이면 각 티어마다 몇 명 있는지 조회
  // ex) /socket/message?tier=BRONZE
  router.get("/socket/message", countUsersInMatching);

  return router;
};
