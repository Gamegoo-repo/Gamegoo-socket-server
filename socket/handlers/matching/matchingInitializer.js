const { PriorityTree } = require("../../common/PriorityTree");

/**
 * 로그인 했을 때 매칭관련 부분 초기화
 * @param {*} socket
 * @param {*} io
 * @returns
 */
function initializeMatching(socket, io) {
  if (!socket.data.matching) {
    socket.data.matching = {};
  }

  socket.data.matching.priorityTree = new PriorityTree(); 
}

module.exports = { initializeMatching };
