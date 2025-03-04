const log = require("../../../../common/customLogger");

/**
 * 소켓 자신만을 매칭 풀에서 삭제 (room leave, priorityTree 제거 및 초기화)
 * @param {*} socket
 * @param {*} io
 * @param {*} roomName
 */
function deleteMySocketFromMatching(socket, io, roomName) {
  // 14) 소켓 룸에서 제거
  socket.leave(roomName);

  // 15) priorityTree에서 삭제
  const room = io.sockets.adapter.rooms.get(roomName);

  if (room) {
    // 룸에 있는 각 소켓에 대해 콜백 함수 실행
    room.forEach((socketId) => {
      const roomSocket = io.sockets.sockets.get(socketId);
      if (roomSocket) {
        // roomSocket의 priorityTree에서 socket의 값을 지우기
        roomSocket.priorityTree.removeByMemberId(socket.data.memberId);
      }
    });
  } else {
    log.warn(`Room ${roomName} does not exist or is empty`,socket);
  }

  // 16) 나의 priorityTree 삭제
  socket.data.matching.priorityTree.clear();

  // 나의 highestPriorityNode 삭제
  socket.data.matching.highestPriorityNode = null;
}

module.exports = { deleteMySocketFromMatching };
