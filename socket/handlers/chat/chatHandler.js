const JWTTokenError = require("../../../common/JWTTokenError");

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
    const chatroomUuid = request.uuid;
    const msg = request.message;
    // uuid가 없는 경우 error event emit
    if (!chatroomUuid) {
      console.error("Fail listening chat-message event: chatroomUuid is missing");
      emitError(socket, "Fail listening chat-message event: chatroomUuid is missing");
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
    postChatMessage(socket, chatroomUuid, requestData)
      .then((response) => {
        // (#10-10) 채팅 저장 정상 응답 받음
        // (#10-11),(#10-12) 해당 채팅방의 상대 회원에게 chat-message emit, 내 socket에게 my-message-broadcast-success emit
        emitChatMessage(socket, chatroomUuid, response);
      })
      .catch((error) => {
        if (error instanceof JWTTokenError) {
          console.error("JWT Token Error:", error.message);
          emitJWTError(socket, error.code, "chat-message", request);
        } else {
          console.error("Error POST chat message:", error);
          emitError(socket, error.message);
        }
      });
  });

  // exit-chatroom event 발생 시, 해당 socket을 chatroom에서 leave 처리
  socket.on("exit-chatroom", (request) => {
    const chatroomUuid = request.uuid;
    // (#14-4), (#15-4) 해당 socket을 해당 chatroom에서 leave 처리
    socket.leave("CHAT_" + chatroomUuid);
    console.log("memberId:", socket.memberId, ", SOCKET LEFT ROOM: " + "CHAT_" + chatroomUuid);
    console.log("======================= chatroom uuid List START =======================");
    const rooms = Array.from(socket.rooms);
    console.log("현재 소켓이 join되어 있는 room 목록:", rooms);
    console.log("======================= chatroom uuid List END =======================");
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
