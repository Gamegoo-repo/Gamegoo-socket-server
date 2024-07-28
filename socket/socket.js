const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../common/config");

const JWT_SECRET = config.jwt.secret;

const initChat = require("./handlers/chat/chatInit");
const initAlarm = require("./handlers/alarm/alarmInit");
const initMatching = require("./handlers/matching/matchingInit");
const initFriend = require("./handlers/friend/friendInit");

const { emitMemberInfo } = require("./emitters/memberEmitter");

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: ["http://localhost:3000", "https://socket.gamegoo.co.kr"], // localhost:3000 cors 허용
      methods: ["*"], // 모든 메소드 허용
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    if (!socket.memberId) {
      console.log("a user connected, memberId:", socket.memberId, "socketId:", socket.id);
    }

    // socket auth에서 JWT 토큰 추출
    const token = socket.handshake.auth.token;

    if (token) {
      // (#2-2) jwt 토큰 검증 및 socket 바인딩
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log("Invalid token");
        } else {
          socket.memberId = decoded.id; // 해당 소켓 객체에 memberId 추가
          socket.token = token; // 해당 소켓 객체에 token 추가
          console.log("a user connected, memberId:", socket.memberId, "socketId:", socket.id);

          // (#2-3) "member-info" event emit
          emitMemberInfo(socket);

          // (#2-5) 초기화 함수들 호출
          initChat(socket, io);
          initAlarm(socket, io);
          initMatching(socket, io);
          initFriend(socket, io);
        }
      });
    } else {
      console.log("No token provided, 비로그인 사용자의 socket connection 입니다.");
    }

    socket.on("disconnect", () => {
      console.log("SOCKET DISCONNECTED: ", socket.id);
    });
  });

  return io;
}

module.exports = initializeSocket;
