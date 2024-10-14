const { emitError, emitConnectionJwtError } = require("../../emitters/errorEmitter");
const JWTTokenError = require("../../../common/JWTTokenError");
const logger = require("../../../common/winston");

const { fetchChatroomUuid } = require("../../apis/chatApi");

/**
 * socket 초기화 즉시 실행될 메소드
 * @param {*} socket
 * @param {*} io
 */
function initializeChat(socket, io) {
  // (#1-10),(#2-6) 소켓 초기화 즉시, API서버로 채팅방 uuid 목록 조회 요청 실행
  fetchChatroomUuid(socket)
    .then((uuidList) => {
      // (#1-11),(#2-7) 채팅방 uuid 목록 정상 응답 받음
      logger.debug("Successfully fetched chatroom UUIDs", `memberId:${socket.memberId}, uuidList:${uuidList}`);

      // (#1-12),(#2-8) 해당 room에 이 소켓을 join
      uuidList.forEach((uuid) => {
        socket.join("CHAT_" + uuid);
        logger.debug("Socket joined room", `socketId:${socket.id}, room:CHAT_${uuid}`);
      });
      const rooms = Array.from(socket.rooms);
      logger.debug("Socket current rooms", `socketId:${socket.id}, rooms:${rooms}`);
    })
    .catch((error) => {
      if (error instanceof JWTTokenError) {
        logger.error("JWT Token Error during initializeChat", `memberId:${socket.memberId}, errorCode:${error.code}, errorMessage:${error.message}`);
        emitConnectionJwtError(socket);
      } else {
        logger.error("Error fetching chatroom UUID data", `memberId:${socket.memberId}, errorMessage:${error.message}`);
        emitError(socket, error.message);
      }
    });
}

module.exports = { initializeChat };
