const jwt = require("jsonwebtoken");
const config = require("../../common/config.js");
const logger = require("../../common/winston.js");

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
    logger.info("=== Login attempt", `IP:${req.ip}, socketId:${req.headers["socket-id"]} ===`);

    // (#1-6) jwt 검증 및 socket 바인딩
    // jwt token 존재 여부 검증
    if (!jwtToken) {
      logger.error("JWT Token missing in request", `IP:${req.ip}`);
      return res.status(401).json(failResponse("AUTH", "JWT 토큰이 없습니다."));
    }

    // JWT 토큰을 검증하고 memberId를 추출
    jwt.verify(jwtToken, JWT_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
      if (err) {
        logger.error("JWT Token verification failed", `IP:${req.ip}, error:${err.message}`);
        return res.status(401).json(failResponse("AUTH", "JWT 토큰 인증에 실패했습니다"));
      }

      const memberId = decoded.memberId; // JWT 토큰에서 memberId 추출
      logger.info("JWT Token verified", `memberId:${memberId}, IP:${req.ip}`);

      // "Socket-Id" 헤더에서 클라이언트 소켓 ID 추출
      const socketId = req.headers["socket-id"];

      // Socket-Id 존재 여부 검증
      if (!socketId) {
        logger.error("Socket ID missing in request", `memberId:${memberId}, IP:${req.ip}`);
        return res.status(401).json(failResponse("SOCKET_INIT_FAILED", "header에서 socket id를 추출할 수 없습니다."));
      }

      // Socket.IO를 통해 클라이언트 소켓을 찾고 memberId, token을 추가
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.memberId = memberId; // 해당 소켓 객체에 memberId 추가
        socket.token = jwtToken; // 해당 소켓 객체에 token 추가
        logger.info("Added memberId and token", `to socketId:${socketId}, memberId:${memberId}`);
      } else {
        logger.error("Socket not found or disconnected", `socketId:${socketId}, memberId:${memberId}`);
        return res.status(404).json(failResponse("SOCKET_NOT_FOUND", "socket id에 해당하는 socket 객체를 찾을 수 없습니다. socket 초기화 실패."));
      }

      // (#1-7) "member-info" event emit
      emitMemberInfo(socket);

      // (#1-9) socket 초기화 함수들 호출
      // 4개의 초기화 메소드가 모두 완료된 후 실행되도록 Promise.all 적용
      Promise.all([initChat(socket, io), initAlarm(socket, io), initMatching(socket, io), initFriend(socket, io)])
        .then(() => {
          // 모든 초기화 함수가 성공적으로 완료된 후 실행
          logger.info("Socket initialization successful", `memberId:${memberId}, socketId:${socketId}`);
          // (#1-17) return 200
          res.status(200).json(successResponse("socket 초기화 성공"));
        })
        .catch((error) => {
          // 초기화 중 하나라도 실패할 경우 에러 처리
          logger.error("Socket initialization failed", `memberId:${memberId}, socketId:${socketId}, error:${error.message}`);
          res.status(500).json(failResponse("SOCKET_INIT_FAILED", "소켓 초기화 중 오류가 발생했습니다."));
        });
    });
  };
}

module.exports = (io) => {
  return {
    login: login(io),
  };
};
