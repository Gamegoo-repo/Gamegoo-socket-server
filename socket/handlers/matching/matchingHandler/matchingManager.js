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
  log.debug("# 8) update my PriorityTree", socket);
  if (!socket.data.matching.priorityTree) {
    log.error("# 13) Priority tree not initialized", socket);
    return;
  }

  // 내 소켓에 다른 사용자 우선순위 값 넣기
  for (const item of priorityList) {
    if (!socket.data.matching.priorityTree.contains(item.matchingUuid)) {
      socket.data.matching.priorityTree.insert(item.matchingUuid, item.priorityValue);    
    } else {
      log.warn(`# 8) ${item.matchingUuid} is already in priorityTree`, socket);
    }
  }

  // 내 소켓의 우선순위 최댓값 노드 변경
  if (socket.data.matching.priorityTree.root) {
    socket.data.matching.highestPriorityNode = socket.data.matching.priorityTree.getMax(socket.data.matching.priorityTree.root);
  }

  log.debug(`# 8) Socket priority tree (sorted): ${JSON.stringify(socket.data.matching.priorityTree.getSortedList(), null, 2)}`, socket);

  if (socket.data.matching.highestPriorityNode) {
    log.info(
      `# 8) Highest priority member in tree: matchingUuid=${socket.data.matching.highestPriorityNode.matchingUuid}, priorityValue=${socket.data.matching.highestPriorityNode.priorityValue}`,
      socket
    );
  } else {
    log.info("# 8) No highest priority node found", socket);
  }
}

/**
 * 다른 사용자의 우선순위 트리 갱신
 * @param {*} io
 * @param {*} socket
 * @param {*} otherPriorityList
 */
async function updateOtherPriorityTrees(io, socket, otherPriorityList) {
  log.debug("# 9) update other PriorityTrees in room", socket);
  for (const item of otherPriorityList) {
    const otherSocket = await getSocketIdByMatchingUuid(io, item.matchingUuid);

    if (otherSocket) {
      if (!otherSocket.data.matching.priorityTree) {
        log.error("# 9) This socket has no priority tree", otherSocket);
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
      
      if (otherSocket.data.matching.highestPriorityNode){
        log.info("# 9) No highest priority node found in other socket", otherSocket);
      }
    } else {
      log.warn(`# 9) Other socket not found for matchingUuid: ${item.matchingUuid}`, socket);
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
  log.debug("# 10) find socket exceeds threshold", socket);
  const matchingUuid = socket.data.matching.matchingUuid;

  if (!socket.data.matching.highestPriorityNode) {
    log.warn("# 10) No highest priority node found for socket", socket);
    return null;
  }

  while (socket.data.matching.highestPriorityNode.priorityValue >= threshold) {
    const otherSocket = await getSocketIdByMatchingUuid(io, socket.data.matching.highestPriorityNode.matchingUuid);

    if (otherSocket) {
      const node = otherSocket.data.matching.priorityTree.getNode(matchingUuid);

      // otherSocket이 내 매칭 정보에 대한 노드를 가지고 있지 않은 경우
      if (!node) { 
        log.warn(`# 10) Other socket (memberId: ${otherSocket.memberId}) has no priority node for matchingUuid: ${matchingUuid}`, otherSocket);
        return null;
      }

      // 해당 otherSocket의 내 매칭 정보에 대한 priorityValue가 threshold를 넘을 경우
      if (node.priorityValue >= threshold) { 
        log.info(`# 10) Matching found with socket memberId: ${otherSocket.memberId} meeting threshold ${threshold}`, socket);
        return otherSocket;
      } else {
        log.debug(`# 10) Priority value ${node.priorityValue} is below threshold ${threshold} for socket memberId: ${otherSocket.memberId}`, socket);
        break;
      }

    } else {
      log.warn("# 10) Could not find other socket by matchingUuid", socket);
      return null;
    }
  }
  log.info("# 10) No matching socket found that meets the threshold", socket);
  return null;
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

/**
 * 소켓 자신만을 매칭 풀에서 삭제 (room leave, priorityTree 제거 및 초기화)
 * @param {*} socket
 * @param {*} io
 * @param {*} roomName
 */
function deleteMySocketFromMatching(socket, io, roomName) {
  // 16) 매칭 room에서 제거
  socket.leave(roomName);
  log.info(`# 16) Socket ${socket.id} left room: ${roomName}`, socket);

  // 17) 모든 소켓의 priorityTree에서 두 소켓 제거
  const room = io.sockets.adapter.rooms.get(roomName);

  if (room) {
      room.forEach((socketId) => {
          const roomSocket = io.sockets.sockets.get(socketId);
          if (roomSocket) {
              roomSocket.data.matching.priorityTree.removeBymatchingUuid(socket.data.matching.matchingUuid);
              log.debug(`# 17) Removed matchingUuid: ${socket.data.matching.matchingUuid} from socket ${roomSocket.id}'s priority tree`, roomSocket);
          }
      });
  } else {
      log.warn(`# 16) Room ${roomName} does not exist or is empty`, socket);
  }

  // 18) priorityTree 삭제
  socket.data.matching.priorityTree.clear();
  log.info(`# 18) Cleared priority tree for socket ${socket.id}`, socket);

  // 18) highestPriorityNode 삭제
  socket.data.matching.highestPriorityNode = null;
}

module.exports = {
  updatePriorityTree,
  updateOtherPriorityTrees,
  handleSocketError,
  joinGameModeRoom,
  findMatching,
  deleteMySocketFromMatching
};
