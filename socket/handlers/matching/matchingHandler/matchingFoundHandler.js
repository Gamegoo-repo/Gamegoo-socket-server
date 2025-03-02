const log = require("../../../../common/customLogger");
/**
 * 소켓 자신만을 매칭 풀에서 삭제 (room leave, priorityTree 제거 및 초기화)
 * @param {*} socket
 * @param {*} io
 * @param {*} roomName
 */
function deleteMySocketFromMatching(socket, io, roomName) {
  // 14) 소켓 룸에서 제거
  // log.info("Removing socket from room", `socketId:${socket.id}, roomName:${roomName}`);
  socket.leave(roomName);

  // 15) priorityTree에서 삭제
  const room = io.sockets.adapter.rooms.get(roomName);

  if (room) {
    // log.debug("Found room, updating priority trees for all sockets", `roomName:${roomName}, socketCount:${room.size}`);
    // 룸에 있는 각 소켓에 대해 콜백 함수 실행
    room.forEach((socketId) => {
      const roomSocket = io.sockets.sockets.get(socketId);
      if (roomSocket) {
        // roomSocket의 priorityTree에서 socket의 값을 지우기
        roomSocket.priorityTree.removeByMemberId(socket.memberId);
        // log.debug("Removed socket from roomSocket's priority tree", `roomSocketId:${roomSocket.id}, memberId:${roomSocket.memberId}`);
        // log.debug(
        //   "Updated priority tree for roomSocket",
        //   `roomSocketId:${roomSocket.id}, sortedPriorityTree:${JSON.stringify(roomSocket.priorityTree.getSortedList(), null, 2)}`
        // );
      }
    });
  } else {
    // log.warn(`Room ${roomName} does not exist or is empty`, `socketId:${socket.id}`);
  }

  // 16) 나의 priorityTree 삭제
  log.info("Clearing priority tree and resetting highestPriorityNode", `socketId:${socket.id}, memberId:${socket.memberId}`);
  socket.priorityTree.clear();

  // 나의 highestPriorityNode 삭제
  socket.highestPriorityNode = null;
}

module.exports = { deleteMySocketFromMatching };
