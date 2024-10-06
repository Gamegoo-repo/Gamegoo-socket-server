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
    logger.warn("Socket is disconnected", `socketId:${socket.id}`);
    return false;
  }

  // 2. 소켓이 특정 roomName에 속해 있는지 확인
  const room = io.sockets.adapter.rooms.get(roomName);

  // room이 존재하고, room 내에 소켓 ID가 포함되어 있는지 확인
  if (room && room.has(socket.id)) {
    logger.debug("Socket is active in the room", `socketId:${socket.id}, roomName:${roomName}`);

    return true;
  } else {
    logger.warn("Socket is not in the room", `socketId:${socket.id}, roomName:${roomName}`);
    return false;
  }
}

module.exports = { isSocketActiveAndInRoom };
