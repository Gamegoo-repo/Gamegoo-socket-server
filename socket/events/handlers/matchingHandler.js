/**
 * 나, 매칭된 사용자 두 개의 소켓을 매칭 풀에서 삭제 (소켓룸, priorityTree)
 * @param {*} socket
 * @param {*} otherSocket
 * @param {*} roomName
 */
function deleteSocketFromMatching(socket, io, otherSocket, roomName) {
  // 9) 소켓 룸에서 제거
  socket.leave(roomName);
  otherSocket.leave(roomName);

  // priorityTree에서 삭제
  const room = io.sockets.adapter.rooms.get(roomName);

  if (room) {
    // 룸에 있는 각 소켓에 대해 콜백 함수 실행
    room.forEach((socketId) => {
      const roomSocket = io.sockets.sockets.get(socketId);
      if (roomSocket) {
        // 10) roomSocket의 priorityTree에서 socket, otherSocket의 값을 지우기
        roomSocket.priorityTree.removeByMemberId(socket.memberId);
        roomSocket.priorityTree.removeByMemberId(otherSocket.memberId);
        console.log("==================================================");
        console.log(`Room Socket (${otherSocket.memberId}) Priority Tree (sorted):`, JSON.stringify(roomSocket.priorityTree.getSortedList(), null, 2));
      }
    });
  } else {
    console.log(`Room ${roomName} does not exist or is empty.`);
  }

  // 11) 각자의 priorityTree 삭제
  socket.priorityTree.clear();
  otherSocket.priorityTree.clear();

  // 각자의 highestPriorityNode 삭제
  socket.highestPriorityNode = null;
  otherSocket.highestPriorityNode = null;
}

module.exports = { deleteSocketFromMatching };
