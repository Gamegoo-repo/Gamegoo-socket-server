const { emitError, emitConnectionJwtError } = require("../../emitters/errorEmitter");
const JWTTokenError = require("../../../common/JWTTokenError");
const log = require("../../../common/customLogger");

const { fetchChatroomUuid } = require("../../apis/chatApi");

/**
 * socket 초기화 즉시 실행될 메소드
 * @param {*} socket
 * @param {*} io
 */
async function initializeChat(socket, io) {
  try {
    // (#1-10),(#2-6) 소켓 초기화 즉시, API서버로 채팅방 uuid 목록 조회 요청 실행
    // (#1-11),(#2-7) 채팅방 uuid 목록 정상 응답 받음
    const uuidList = await fetchChatroomUuid(socket);

    // (#1-12),(#2-8) 해당 room에 이 소켓을 join
    uuidList.forEach((uuid) => {
      socket.join("CHAT_" + uuid);
    });

    const rooms = Array.from(socket.rooms);
    log.debug(`Socket current rooms:${rooms}`, socket);
  } catch (error) {
    log.error(`Error during initializeChat: ${error.message}`, socket);
    if (error instanceof JWTTokenError) {
      emitConnectionJwtError(socket);
    } else {
      emitError(socket, error.message);
    }
  }
}

module.exports = { initializeChat };
