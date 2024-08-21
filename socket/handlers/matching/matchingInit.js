const { setupMatchSocketListeners } = require("./matchingSocketListeners");
const { initializeMatching } = require("./matchingInitializer");

function initMatching(socket, io) {
  initializeMatching(socket, io); // 초기화 설정
  setupMatchSocketListeners(socket, io); // 리스너 설정
}

module.exports = initMatching;
