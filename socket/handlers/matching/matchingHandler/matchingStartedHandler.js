const JWTTokenError = require("../../../../common/JWTTokenError");
const log = require("../../../../common/customLogger");
const { getSocketIdByMatchingUuid } = require("../../../common/memberSocketMapper");
const { emitError, emitJWTError } = require("../../../emitters/errorEmitter");

/**
 * 내 우선순위 트리 갱신
 * @param {*} socket
 * @param {*} priorityList
 * @returns {boolean} 중복 여부
 */
function updatePriorityTree(socket, priorityList) {
  log.debug(`#8 update my PriorityTree`, socket);
  if (!socket.data.matching.priorityTree) {
    log.error("Priority tree not initialized", socket);
    return;
  }

  log.debug("Updating priority tree", socket);

  // 내 소켓에 다른 사용자 우선순위 값 넣기
  for (const item of priorityList) {
    if (!socket.data.matching.priorityTree.contains(item.matchingUuid)) {
      socket.data.matching.priorityTree.insert(item.matchingUuid, item.priorityValue);
    } else {
      log.warn(`${item.matchingUuid} is already in priorityTree`, socket);
    }
  }

  // 내 소켓의 우선순위 최댓값 노드 변경
  if (socket.data.matching.priorityTree.root) {
    socket.data.matching.highestPriorityNode = socket.data.matching.priorityTree.getMax(socket.data.matching.priorityTree.root);
  }

  log.debug(`Socket priority tree (sorted) sortedList:${JSON.stringify(socket.data.matching.priorityTree.getSortedList(), null, 2)}`, socket);

  if (socket.data.matching.highestPriorityNode) {
    log.info(
      `Highest priority member in tree matchingUuid: ${socket.data.matching.highestPriorityNode.matchingUuid}, priorityValue:${socket.data.matching.highestPriorityNode.priorityValue}`, socket);
  } else {
    log.info("No highest priority node found", socket);
  }
}

/**
 * 다른 사용자의 우선순위 트리 갱신
 * @param {*} io
 * @param {*} socket
 * @param {*} otherPriorityList
 */
async function updateOtherPriorityTrees(io, socket, otherPriorityList) {
  log.debug(`#9 update other PriorityTrees in room`, socket);
  for (const item of otherPriorityList) {
    const otherSocket = await getSocketIdByMatchingUuid(io, item.matchingUuid);

    if (otherSocket) {
      if (!otherSocket.data.matching.priorityTree) {
        log.error(`this socket has no priority tree`, otherSocket);
        return;
      }

      // 다른 소켓에 내 우선순위 값 넣기
      if (!otherSocket.data.matching.priorityTree.contains(socket.data.matching.matchingUuid)) {
        otherSocket.data.matching.priorityTree.insert(socket.data.matching.matchingUuid, item.priorityValue);
      } else {
        log.warn(`${socket.data.matching.matchingUuid} is already in priorityTree`, otherSocket);
      }

      // 다른 소켓의 우선순위 최댓값 노드 변경
      if (otherSocket.data.matching.priorityTree.root) {
        otherSocket.data.matching.highestPriorityNode = otherSocket.data.matching.priorityTree.getMax(otherSocket.data.matching.priorityTree.root);
      }
      
      if (otherSocket.data.matching.highestPriorityNode) {
        log.info("Other socket's highest priority member", otherSocket);
      } else {
        log.info("No highest priority node found", otherSocket);
      }
    }
  }
}

/**
 * 매칭 상대 찾기
 * @param {*} socket
 * @param {*} io
 * @param {*} threshold
 */
async function findMatching(socket, io, threshold) {
  log.debug(`#10 find socket exceeds threshold`, socket);
  const matchingUuid = socket.data.matching.matchingUuid;

  if (!socket.data.matching.highestPriorityNode) {
    log.warn("No highest priority node found for socket", socket);
    return null;
  }

  while (socket.data.matching.highestPriorityNode.priorityValue >= threshold) {
    const otherSocket = await getSocketIdByMatchingUuid(io, socket.data.matching.highestPriorityNode.matchingUuid);

    if (otherSocket) {
      log.debug(`Found other socket with priority exceeding value ${otherSocket.memberId} `, socket);

      const node = otherSocket.data.matching.priorityTree.getNode(matchingUuid);

      // otherSocket이 highestPriorityNode가 없는 경우
      if (!node) { 
        log.warn(`Other socket has no priority node about ${matchingUuid}`, otherSocket);
        return null;
      }

      // 해당 otherSocket의 내 매칭 정보에 대한 priorityValue가 threshold를 넘을 경우
      if (node.priorityValue >= threshold) { 
        return otherSocket;
      }

    } else {
      log.warn("Could not find other socket by matchingUuid", socket);
      return null;
    }
  }
}


/**
 * API 응답 에러 처리
 * @param {*} socket
 * @param {*} error
 */
function handleSocketError(socket, error) {
  if (error instanceof JWTTokenError) {
    log.error("JWT Token Error occurred", socket);
    emitJWTError(socket, error.code, error.message);
  } else {
    log.error("Error occurred", socket);
    emitError(socket, error.message);
  }
}

/**
 * 매칭 룸 입장
 * @param {*} socket
 * @param {*} io
 * @param {*} roomName
 */
function joinGameModeRoom(socket, io, roomName) {
  socket.join(roomName);
  const usersInRoom = getUsersInRoom(io, roomName);
  log.info(`User ${socket.id} joined room: ${roomName}`, socket);
  log.debug(`Room ${roomName} users: ${usersInRoom.join(", ")}`, socket);
}

/**
 * 특정 룸에 있는 사용자 모두 조회
 * @param {*} io
 * @param {*} room
 * @returns {Array} usersInRoom
 */
function getUsersInRoom(io, room) {
  const clients = io.sockets.adapter.rooms.get(room) || new Set();
  return Array.from(clients);
}

module.exports = {
  updatePriorityTree,
  updateOtherPriorityTrees,
  handleSocketError,
  joinGameModeRoom,
  findMatching,
};
