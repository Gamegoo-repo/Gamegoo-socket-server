const { initializeChat } = require("./chatInitializer");
const { setupChatListeners } = require("./chatHandler");

function initChat(socket, io) {
  initializeChat(socket, io); // socket 초기화 즉시 실행할 메소드
  setupChatListeners(socket, io); // 특정 event에 대한 handler
}

module.exports = initChat;
