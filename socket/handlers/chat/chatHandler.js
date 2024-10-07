const JWTTokenError = require("../../../common/JWTTokenError");
const logger = require("../../../common/winston");

const { emitError, emitJWTError } = require("../../emitters/errorEmitter");
const { postChatMessage, startTestChattingByMatching } = require("../../apis/chatApi");
const { emitChatMessage, emitChatSystemMessage, emitTestMatchingChattingSuccess } = require("../../emitters/chatEmitter");
const { getSocketIdByMemberId } = require("../../common/memberSocketMapper");

/**
 * socket event에 대한 listener
 * @param {*} socket
 */
function setupChatListeners(socket, io) {
  // chat-message event 발생 시, 8080서버에 채팅 등록 api 요청 및 해당 room에 event emit
  socket.on("chat-message", (request) => {
    logger.info("=== Received 'chat-message' event", `socketId:${socket.id}, chatroomUuid:${request.uuid} ===`);
    const chatroomUuid = request.uuid;
    const msg = request.message;
    // uuid가 없는 경우 error event emit
    if (!chatroomUuid) {
      logger.error("Fail listening 'chat-message' event: chatroomUuid is missing", `socketId:${socket.id}`);
      emitError(socket, "Fail listening chat-message event: chatroomUuid is missing");
      return;
    }

    let requestData = { message: msg };

    // 시스템 값이 있는 경우
    if (request.system) {
      requestData.system = request.system;

      // 상대방 socket에게 시스템 메시지 먼저 emit
      const targetSystemMessage = {
        chatroomUuid: chatroomUuid,
        senderId: 0,
        senderName: "SYSTEM",
        senderProfileImg: 0,
        message: "내가 게시한 글을 보고 말을 걸어왔어요.",
        createdAt: null,
        timestamp: null,
        boardId: request.system.boardId,
      };
      // (#10-3) 상대 socket에게 chat-system-message emit
      emitChatSystemMessage(socket, chatroomUuid, targetSystemMessage);
    }

    // (#10-4) 8080서버에 채팅 저장 api 요청
    logger.http("Sending POST request to save chat message", `socketId:${socket.id}, chatroomUuid:${chatroomUuid}`);
    postChatMessage(socket, chatroomUuid, requestData)
      .then((response) => {
        // (#10-10) 채팅 저장 정상 응답 받음
        logger.info("Successfully saved chat message", `socketId:${socket.id}, chatroomUuid:${chatroomUuid}`);

        // (#10-11),(#10-12) 해당 채팅방의 상대 회원에게 chat-message emit, 내 socket에게 my-message-broadcast-success emit
        emitChatMessage(socket, chatroomUuid, response);
      })
      .catch((error) => {
        if (error instanceof JWTTokenError) {
          logger.error("JWT Token Error during POST chat message", `socketId:${socket.id}, errorMessage:${error.message}`);
          emitJWTError(socket, error.code, error.message);
        } else {
          logger.error("Error occurred during POST chat message", `socketId:${socket.id}, errorMessage:${error.message}`);
          emitError(socket, error.message);
        }
      });
    logger.info("=== Completed 'chat-message' event processing", `socketId:${socket.id} ===`);
  });

  // exit-chatroom event 발생 시, 해당 socket을 chatroom에서 leave 처리
  socket.on("exit-chatroom", (request) => {
    logger.info("=== Received 'exit-chatroom' event", `socketId:${socket.id}, chatroomUuid:${request.uuid} ===`);
    const chatroomUuid = request.uuid;

    if (!chatroomUuid) {
      logger.error("Exit chatroom request failed: chatroomUuid is missing", `socketId:${socket.id}`);
      emitError(socket, "Exit chatroom request failed: chatroomUuid is missing");
      return;
    }
    // (#14-4), (#15-4) 해당 socket을 해당 chatroom에서 leave 처리
    socket.leave("CHAT_" + chatroomUuid);
    logger.info("Socket left chatroom", `memberId:${socket.memberId}, chatroomUuid:${chatroomUuid}, socketId:${socket.id}`);

    const rooms = Array.from(socket.rooms);
    logger.debug("Socket current rooms", `socketId:${socket.id}, rooms:${rooms}`);
    logger.info("=== Completed 'exit-chatroom' event processing", `socketId:${socket.id} ===`);
  });

  socket.on("test-matching-request", (request) => {
    const targetMemberId = request.matchingMemberId;
    startTestChattingByMatching(socket, targetMemberId).then(async (chatroomUuid) => {
      // 내 socket room join
      socket.join("CHAT_" + chatroomUuid);

      // 상대 socket room join
      const targetSocket = await getSocketIdByMemberId(io, targetMemberId);
      targetSocket.join("CHAT_" + chatroomUuid);

      emitTestMatchingChattingSuccess(io, chatroomUuid);
    });
  });
}

module.exports = { setupChatListeners };
