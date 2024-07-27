const jwt = require("jsonwebtoken");
const config = require("../../config/config");

const JWT_SECRET = config.jwt.secret;

const initChat = require("../../socket/handlers/chat/chatInit");
const initAlarm = require("../../socket/handlers/alarm/alarmInit");
const initMatching = require("../../socket/handlers/matching/matchingInit");
const initFriend = require("../../socket/handlers/friend/friendInit");

const { emitMemberInfo } = require("../../socket/emitters/memberEmitter.js");

const { successResponse, failResponse } = require("../common/responseFormatter.js");

/**
 * 로그인 요청한 클라이언트의 socket에 memberId, jwt를 설정하고 socket 초기화 메소드 실행
 * @param {*} io
 * @returns
 */
function login(io) {
  return (req, res) => {
    // "Authorization" 헤더에서 JWT 토큰 추출
    const authorizationHeader = req.headers["authorization"];
    let jwtToken = null;
    if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
      jwtToken = authorizationHeader.substring(7); // 'Bearer ' 이후의 부분이 토큰임
    }
    // (#1-9) jwt 검증 및 socket 바인딩
    // jwt token 존재 여부 검증
    if (!jwtToken) {
      return res.status(401).json(failResponse("AUTH", "JWT 토큰이 없습니다."));
    }

    // JWT 토큰을 검증하고 memberId를 추출
    jwt.verify(jwtToken, JWT_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
      if (err) {
        console.error("Error verifying token:", err);
        return res.status(401).json(failResponse("AUTH", "JWT 토큰 인증에 실패했습니다"));
      }

      const memberId = decoded.id; // JWT 토큰에서 id 추출

      // "Socket-Id" 헤더에서 클라이언트 소켓 ID 추출
      const socketId = req.headers["socket-id"];

      // Socket-Id 존재 여부 검증
      if (!socketId) {
        return res.status(401).json(failResponse("SOCKET_INIT_FAILED", "header에서 socket id를 추출할 수 없습니다."));
      }

      // Socket.IO를 통해 클라이언트 소켓을 찾고 memberId, token을 추가
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.memberId = memberId; // 해당 소켓 객체에 memberId 추가
        socket.token = jwtToken; // 해당 소켓 객체에 token 추가
        console.log(`Added memberId ${memberId} to socket ${socketId}`);
      } else {
        console.error(`Socket ${socketId} not found or disconnected.`);
        return res.status(404).json(failResponse("SOCKET_NOT_FOUND", "socket id에 해당하는 socket 객체를 찾을 수 없습니다. socket 초기화 실패."));
      }

      // (#1-10) "member-info" event emit
      emitMemberInfo(socket);

      // (#1-12) socket 초기화 함수들 호출
      initChat(socket, io);
      initAlarm(socket, io);
      initMatching(socket, io);
      initFriend(socket, io);

      // (#1-20) return 200
      res.status(200).json(successResponse("socket 초기화 성공"));
    });
  };
}

module.exports = (io) => {
  return {
    login: login(io),
  };
};
