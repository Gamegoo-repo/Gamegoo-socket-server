const JWTTokenError = require("../../../common/JWTTokenError");
const log = require("../../../common/customLogger");

const { emitError, emitJWTError } = require("../../emitters/errorEmitter");
const { postChatMessage, startTestChattingByMatching } = require("../../apis/chatApi");
const { emitChatMessage, emitChatSystemMessage, emitTestMatchingChattingSuccess } = require("../../emitters/chatEmitter");
const { getSocketIdByMemberId } = require("../../common/memberSocketMapper");

/**
 * chat-message event 발생 시, 8080서버에 채팅 등록 api 요청 및 해당 room에 event emit
 * @param {*} socket
 * @param {*} request
 * @returns
 */
async function handleChatMessage(socket, request) {
  const chatroomUuid = request.uuid;
  const msg = request.message;
  // uuid가 없는 경우 error event emit
  if (!chatroomUuid) {
    log.error("Error occured during chatHandler.handleChatMessage: chatroomUuid is missing", socket);
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
  try {
    const response = await postChatMessage(socket, chatroomUuid, requestData);

    // (#10-10) 채팅 저장 정상 응답 받음
    // (#10-11),(#10-12) 해당 채팅방의 상대 회원에게 chat-message emit, 내 socket에게 my-message-broadcast-success emit
    if (response) {
      emitChatMessage(socket, chatroomUuid, response);
    }
  } catch (error) {
    log.error(`Error occured during chatHandler.handleChatMessage: ${error.message}`, socket);
    if (error instanceof JWTTokenError) {
      emitJWTError(socket, error.code, error.message);
    } else {
      emitError(socket, error.message);
    }
  }
}

/**
 * exit-chatroom event 발생 시, 해당 socket을 chatroom에서 leave 처리
 * @param {*} socket
 * @param {*} request
 * @returns
 */
function handleExitChatroom(socket, request) {
  const chatroomUuid = request.uuid;

  if (!chatroomUuid) {
    log.error("Error occured during chatHandler.handleExitChatroom chatroomUuid is missing:", socket);
    emitError(socket, "Exit chatroom request failed: chatroomUuid is missing");
    return;
  }
  // (#14-4), (#15-4) 해당 socket을 해당 chatroom에서 leave 처리
  socket.leave("CHAT_" + chatroomUuid);
  log.debug(`Socket left room: ${chatroomUuid}`, socket);
}

async function handleTestMatchingRequest(socket, request) {
  const targetMemberId = request.matchingMemberId;

  try {
    const chatroomUuid = await startTestChattingByMatching(socket, targetMemberId);
    // 내 socket room join
    socket.join("CHAT_" + chatroomUuid);

    // 상대 socket room join
    const targetSocket = await getSocketIdByMemberId(io, targetMemberId);
    targetSocket.join("CHAT_" + chatroomUuid);

    emitTestMatchingChattingSuccess(io, chatroomUuid);
  } catch (error) {
    log.error(`Error occured during chatHandler.handleTestMatchingRequest: ${error.message}`, socket);
    if (error instanceof JWTTokenError) {
      emitJWTError(socket, error.code, error.message);
    } else {
      emitError(socket, error.message);
    }
  }
}

/**
 * socket event에 대한 listener
 * @param {*} socket
 */
function setupChatListeners(socket, io) {
  socket.on("chat-message", (request) => handleChatMessage(socket, request));

  socket.on("exit-chatroom", (request) => handleExitChatroom(socket, request));

  socket.on("test-matching-request", (request) => handleTestMatchingRequest(socket, request));
}

module.exports = { setupChatListeners };
