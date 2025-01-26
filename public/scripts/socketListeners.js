import {
  handleConnectionJwtError,
  handleJwtExpiredError,
  handleMemberInfo,
  handleInitOnlineFriendList,
  handleFriendOnline,
  handleFriendOffline,
  handleMyMessageBroadcastSuccess,
  handleChatMessage,
  handleJoinedNewChatroom,
  handleChatSystemMessage,
  handleMannerSystemMessage,
  handleTestMatchingChattingSuccess,
} from "./socketEventHandlers.js";

/**
 * socket event listener 등록
 * @param {*} socket
 * @param {*} state
 */
export function setupSocketListeners(socket, state) {
  socket.on("connection-jwt-error", () => handleConnectionJwtError(socket, state));

  socket.on("jwt-expired-error", async (data) => handleJwtExpiredError(socket, state, data));

  socket.on("member-info", (data) => handleMemberInfo(state, data));

  socket.on("init-online-friend-list", (data) => handleInitOnlineFriendList(state, data));

  socket.on("friend-online", (data) => handleFriendOnline(state, data));

  socket.on("friend-offline", (data) => handleFriendOffline(state, data));

  socket.on("my-message-broadcast-success", (data) => handleMyMessageBroadcastSuccess(state, data));

  socket.on("chat-message", (data) => handleChatMessage(state, data));

  socket.on("joined-new-chatroom", () => handleJoinedNewChatroom());

  socket.on("chat-system-message", (data) => handleChatSystemMessage(state, data));

  socket.on("manner-system-message", (data) => handleMannerSystemMessage(state, data));

  socket.on("test-matching-chatting-success", (data) => handleTestMatchingChattingSuccess(state, data));
}
