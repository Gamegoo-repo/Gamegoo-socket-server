const JWTTokenError = require("../../../common/JWTTokenError");

const { emitError, emitJWTError } = require("../../emitters/errorEmitter");
const { postChatMessage } = require("../../apis/chatApi");
const { emitChatMessage } = require("../../emitters/chatEmitter");
/**
 * socket event에 대한 listener
 * @param {*} socket
 */
function setupChatListeners(socket) {
  // chat-message event 발생 시, 8080서버에 채팅 등록 api 요청 및 해당 room에 event emit
  socket.on("chat-message", (request) => {
    const chatroomUuid = request.uuid;
    const msg = request.message;
    // uuid가 없는 경우 error event emit
    if (!chatroomUuid) {
      console.error("Fail listening chat-message event: chatroomUuid is missing");
      emitError(socket, "Fail listening chat-message event: chatroomUuid is missing");
    }

    // (#10-2) 8080서버에 채팅 저장 api 요청
    postChatMessage(socket, chatroomUuid, msg)
      .then((response) => {
        // (#10-3) 채팅 저장 정상 응답 받음
        // (#10-4),(#10-5) 해당 채팅방의 상대 회원에게 chat-message emit, 내 socket에게 my-message-broadcast-success emit
        emitChatMessage(socket, chatroomUuid, response);
      })
      .catch((error) => {
        if (error instanceof JWTTokenError) {
          console.error("JWT Token Error:", error.message);
          emitJWTError(socket, error.code, error.message);
        } else {
          console.error("Error fetching friend list data:", error);
          emitError(socket, error.message);
        }
      });
  });
}

module.exports = { setupChatListeners };
