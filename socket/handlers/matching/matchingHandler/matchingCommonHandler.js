/**
 * 해당 socket이 connect 상태이면서, 해당 room에 join된 상태인지 여부 리턴
 * @param {*} socket
 * @param {*} io
 * @param {*} roomName
 * @returns
 */
function isSocketActiveAndInRoom(socket, io, roomName) {
  // 1. 소켓이 연결 상태인지 확인
  if (!socket.connected) {
    console.log(`Socket ${socket.id} is disconnected.`);
    return false;
  }

  // 2. 소켓이 특정 roomName에 속해 있는지 확인
  const room = io.sockets.adapter.rooms.get(roomName);

  // room이 존재하고, room 내에 소켓 ID가 포함되어 있는지 확인
  if (room && room.has(socket.id)) {
    return true;
  } else {
    return false;
  }
}

module.exports = { isSocketActiveAndInRoom };
