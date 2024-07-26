const { initializeFriend } = require("./friendInitializer");
const { setupFriendListeners } = require("./friendHandler");

function initFriend(socket, io) {
  initializeFriend(socket, io); // socket 초기화 즉시 실행할 메소드
  setupFriendListeners(socket);
}

module.exports = initFriend;
