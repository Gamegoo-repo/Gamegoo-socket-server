const formatResponse = require("../common/responseFormatter.js");
const log = require("../../common/customLogger");

/**
 * chat message를 socket에 전달
 * @param {*} socket
 * @param {*} chatroomUuid
 * @param {*} data
 */
function emitChatMessage(socket, chatroomUuid, data) {
  data.chatroomUuid = chatroomUuid;

  // uuid에 해당하는 room에 있는 socket 중 나를 제외한 socket에 broadcast
  const roomName = "CHAT_" + chatroomUuid;
  socket.broadcast.to(roomName).emit("chat-message", formatResponse("chat-message", data));
  log.broadcast("chat-message", roomName, JSON.stringify(data));

  // 내 socket에 message broadcast가 성공했음을 emit
  socket.emit("my-message-broadcast-success", formatResponse("my-message-broadcast-success", data));
  log.emit("my-message-broadcast-success", socket, JSON.stringify(data));
}

/**
 * system message를 chatroomUuid room에 있는 상대 socket에게 전달
 * @param {*} socket
 * @param {*} chatroomUuid
 * @param {*} targetSystemMessage
 */
function emitChatSystemMessage(socket, chatroomUuid, targetSystemMessage) {
  // uuid에 해당하는 room에 있는 socket 중 나를 제외한 socket에 broadcast
  const roomName = "CHAT_" + chatroomUuid;
  socket.broadcast.to(roomName).emit("chat-system-message", formatResponse("chat-system-message", targetSystemMessage));
  log.broadcast("chat-system-message", roomName, JSON.stringify(targetSystemMessage));
}

/**
 * 해당 socket이 새로운 chatroom에 join되었음을 전달
 * @param {*} socket
 */
function emitJoinedNewChatroom(socket) {
  const data = "새로운 채팅방 room에 socket join 되었습니다. 채팅방 목록을 업데이트 해주세요.";
  socket.emit("joined-new-chatroom", formatResponse("joined-new-chatroom", data));
  log.emit("joined-new-chatroom", socket);
}

/**
 * 매칭을 통한 채팅방 시작 테스트 성공되었음을 chatroom에 있는 모든 socket 에게 전달
 * @param {*} io
 * @param {*} chatroomUuid
 */
function emitTestMatchingChattingSuccess(io, chatroomUuid) {
  const data = { chatroomUuid: chatroomUuid };
  const roomName = "CHAT_" + chatroomUuid;
  io.to(roomName).emit("test-matching-chatting-success", formatResponse("test-matching-chatting-success", data));
  log.broadcast("test-matching-chatting-success", roomName, `chatroomUuid: ${chatroomUuid}`);
}

/**
 * 해당 socket에게  manner system message emit
 * @param {*} socket
 * @param {*} messageContent
 */
function emitMannerSystemMessage(socket, chatroomUuid, messageContent, timestamp) {
  const systemMessage = {
    chatroomUuid: chatroomUuid,
    senderId: 0,
    senderName: "SYSTEM",
    senderProfileImg: 0,
    message: messageContent,
    systemType: 5,
    createdAt: null,
    timestamp: timestamp,
  };
  socket.emit("manner-system-message", formatResponse("manner-system-message", systemMessage));
  log.emit("manner-system-message", socket, JSON.stringify(systemMessage));
}
/**
 * 해당 socket에게 new-notification event emit
 * @param {*} socket
 */
function emitNewNotificationEvent(socket, notificationId, notificationType, content, pageUrl, read) {
  const data = {
    notificationId: notificationId,
    notificationType: notificationType,
    content: content,
    pageUrl: pageUrl,
    read: read,
  };
  socket.emit("new-notification", formatResponse("new-notification", data));
  log.emit("new-notification", socket, JSON.stringify(data));
}

module.exports = {
  emitChatMessage,
  emitJoinedNewChatroom,
  emitChatSystemMessage,
  emitTestMatchingChattingSuccess,
  emitMannerSystemMessage,
  emitNewNotificationEvent,
};
