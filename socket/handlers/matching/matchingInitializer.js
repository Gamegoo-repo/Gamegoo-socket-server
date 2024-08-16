const PriorityQueue = require('priorityqueuejs');

/**
 * 로그인 했을 때 매칭관련 부분 초기화 
 * @param {*} socket 
 * @param {*} io 
 * @returns 
 */
function initializeMatching(socket, io) {
  // 우선순위 큐 설정
  socket.priorityTable = {};

  return;
}

module.exports = { initializeMatching };
