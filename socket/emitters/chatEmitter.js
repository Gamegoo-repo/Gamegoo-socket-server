const formatResponse = require("../common/responseFormatter");

/**
 * chat message를 socket에 전달
 * @param {*} socket
 * @param {*} chatroomUuid
 * @param {*} data
 */
function emitChatMessage(socket, chatroomUuid, data) {
  data.chatroomUuid = chatroomUuid;

  // uuid에 해당하는 room에 있는 socket 중 나를 제외한 socket에 broadcast
  socket.broadcast.to("CHAT_" + chatroomUuid).emit("chat-message", formatResponse("chat-message", data));

  // 내 socket에 message broadcast가 성공했음을 emit
  socket.emit("my-message-broadcast-success", formatResponse("my-message-broadcast-success", data));
}

module.exports = {
  emitChatMessage,
};
