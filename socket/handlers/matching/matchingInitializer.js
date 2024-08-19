const { PriorityTree } = require("../../common/PriorityTree"); // 올바르게 가져오기

/**
 * 로그인 했을 때 매칭관련 부분 초기화
 * @param {*} socket
 * @param {*} io
 * @returns
 */
function initializeMatching(socket, io) {
  // 우선순위 큐 설정
  socket.priorityTree = new PriorityTree(); // socket.priorityTree 초기화

  // setTimeout 타이머 ID를 저장할 array 초기화
  socket.retryTimeouts = [];
}

module.exports = { initializeMatching };
