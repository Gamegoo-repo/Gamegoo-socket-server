const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../common/config");

const JWT_SECRET = config.jwt.secret;

const JWTTokenError = require("../common/JWTTokenError");
const logger = require("../common/winston");

const initChat = require("./handlers/chat/chatInit");
const initAlarm = require("./handlers/alarm/alarmInit");
const initMatching = require("./handlers/matching/matchingInit");
const initFriend = require("./handlers/friend/friendInit");

const { emitMemberInfo } = require("./emitters/memberEmitter");
const { emitFriendOffline } = require("./emitters/friendEmitter");
const { updateMatchingStatusApi } = require("./apis/matchApi");

const { emitError, emitJWTError } = require("./emitters/errorEmitter");

const { fetchFriends } = require("./apis/friendApi");

const { getSocketIdsByMemberIds } = require("./common/memberSocketMapper");
const { deleteMySocketFromMatching } = require("./handlers/matching/matchingHandler/matchingFoundHandler");

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: ["http://localhost:3000", "https://socket.gamegoo.co.kr", "https://www.gamegoo.co.kr"], // localhost:3000 cors 허용
      methods: ["*"], // 모든 메소드 허용
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // socket auth에서 JWT 토큰 추출
    const token = socket.handshake.auth.token;
    logger.info("CONNECTED:: New socket connection attempt", `socketId:${socket.id}`);

    if (token) {
      // (#2-2) jwt 토큰 검증 및 socket 바인딩
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          logger.info("Token verification failed", `socketId:${socket.id}, token:${token}, error:${err.message}`);
        } else {
          socket.memberId = decoded.id; // 해당 소켓 객체에 memberId 추가
          socket.token = token; // 해당 소켓 객체에 token 추가
          //console.log("a user connected, memberId:", socket.memberId, "socketId:", socket.id);
          logger.info("Token verification success", `memberId:${socket.memberId}, socketId:${socket.id}`);
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
      logger.info("No token provided, non-logged-in socket connection", `socketId:${socket.id}`);
    }

    // disconnect 시에 친구 소켓에게 friend-offline event emit
    socket.on("disconnect", async () => {
      //console.log("DISCONNECTED, memberId: ", socket.memberId);
      logger.info("DISCONNECTED:: socket connection closed", `memberId:${socket.memberId}, socketId:${socket.id}`);

      // 해당 socket이 memberId를 가질 때에만(로그인한 소켓인 경우에만)
      if (socket.memberId) {
        // (#6-2) 매칭 status 변경 API 요청
        if (socket.gameMode != null) {
          logger.debug("Updating matching status to 'QUIT' for gameMode", `memberId:${socket.memberId}, gameMode:${socket.gameMode}`);
          await updateMatchingStatusApi(socket, "QUIT");
        }

        // (#6-4) 매칭 room에 join 되어 있는 경우, 해당 room의 모든 소켓의 priorityTree 에서 해당 소켓 노드 제거
        const roomName = "GAMEMODE_" + socket.gameMode;
        logger.debug("Removing socket from all priorityTree", `memberId:${socket.memberId}, roomName:${roomName}`);
        deleteMySocketFromMatching(socket, io, roomName);

        // (#6-5) 친구 목록 조회 api 요청
        // (#6-6) 친구 목록 조회 성공 응답 받음
        fetchFriends(socket)
          .then(async (friendIdList) => {
            // (#6-7) 친구 memberId로 socketId 찾기
            const friendSocketList = await getSocketIdsByMemberIds(io, friendIdList);

            // (#6-8) 친구 소켓에게 "friend-offline" event emit
            emitFriendOffline(io, friendSocketList, socket.memberId);
          })
          .catch((error) => {
            if (error instanceof JWTTokenError) {
              logger.error(
                "JWT Token Error occurred while fetching friend list",
                `memberId:${socket.memberId}, errorCode:${error.code}, errorMessage:${error.message}`
              );
              emitJWTError(socket, error.code, error.message);
            } else {
              logger.error("Error fetching friend list data", `memberId:${socket.memberId}, errorMessage:${error.message}`);
              emitError(socket, error.message);
            }
          });
      }
    });
  });

  return io;
}

module.exports = initializeSocket;
