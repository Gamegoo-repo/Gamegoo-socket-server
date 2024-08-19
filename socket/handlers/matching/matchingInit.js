const { setupMatchListeners } = require("./matchingListeners");
const { initializeMatching } = require("./matchingInitializer");

function initMatching(socket, io) {
  initializeMatching(socket, io); // 초기화 설정
  setupMatchListeners(socket, io); // 리스너 설정
}

module.exports = initMatching;
