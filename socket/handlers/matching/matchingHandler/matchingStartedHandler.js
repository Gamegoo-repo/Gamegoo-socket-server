const JWTTokenError = require("../../../../common/JWTTokenError");
const log = require("../../../../common/customLogger");
const { getSocketIdByMemberId } = require("../../../common/memberSocketMapper");
const { emitError, emitJWTError } = require("../../../emitters/errorEmitter");

/**
 * 내 우선순위 트리 갱신
 * @param {*} socket
 * @param {*} priorityList
 * @returns {boolean} 중복 여부
 */
function updatePriorityTree(socket, priorityList) {
  if (!socket.priorityTree) {
    log.error("Priority tree not initialized", socket);
    return;
  }

  log.info("Updating priority tree", socket);

  // 내 소켓에 다른 사용자 우선순위 값 넣기
  for (const item of priorityList) {
    if (!socket.priorityTree.contains(item.matchingUuid)) {
      socket.priorityTree.insert(item.matchingUuid, item.priorityValue);
    }
  }

  // 내 소켓의 우선순위 최댓값 노드 변경
  if (socket.priorityTree.root) {
    socket.highestPriorityNode = socket.priorityTree.getMax(socket.priorityTree.root);
    log.debug(
      "Highest priority node updated",
      socket,
      `matchingUuid:${socket.highestPriorityNode?.matchingUuid}, priorityValue:${socket.highestPriorityNode?.priorityValue}`
    );
  }

  log.debug(
    "Socket priority tree (sorted)",
    socket,
    `matchingUuid:${socket.matchingUuid}, socketId:${socket.id}, sortedList:${JSON.stringify(socket.priorityTree.getSortedList(), null, 2)}`
  );

  if (socket.highestPriorityNode) {
    log.info(
      "Highest priority member in tree",
      socket,
      `matchingUuid:${socket.highestPriorityNode.matchingUuid}, priorityValue:${socket.highestPriorityNode.priorityValue}`
    );
  } else {
    log.warn("No highest priority node found", socket);
  }
}

/**
 * 다른 사용자의 우선순위 트리 갱신
 * @param {*} io
 * @param {*} socket
 * @param {*} otherPriorityList
 */
async function updateOtherPriorityTrees(io, socket, otherPriorityList) {
  log.info("Updating other users' priority trees", socket);

  for (const item of otherPriorityList) {
    const otherSocket = await getSocketIdByMemberId(io, item.memberId);
    log.debug("Fetched other user's socket", otherSocket);

    if (otherSocket) {
      if (!otherSocket.priorityTree) {
        log.error("Other socket has no priority tree", otherSocket);
        return;
      }

      if (!otherSocket.priorityTree.contains(socket.matchingUuid)) {
        otherSocket.priorityTree.insert(socket.matchingUuid, item.priorityValue);
        log.debug("Inserted priority into other user's tree", otherSocket);
      }

      if (otherSocket.priorityTree.root) {
        otherSocket.highestPriorityNode = otherSocket.priorityTree.getMax(otherSocket.priorityTree.root);
        log.debug("Updated highest priority node for other user", otherSocket);
      }

      log.debug(
        "Other user's priority tree (sorted)",
        otherSocket,
        JSON.stringify(otherSocket.priorityTree.getSortedList(), null, 2)
      );

      if (otherSocket.highestPriorityNode) {
        log.info("Other socket's highest priority member", otherSocket);
      } else {
        log.warn("No highest priority node found", otherSocket);
      }
    }
  }

  log.info("Other users' priority trees updated", socket);
}

/**
 * 매칭 상대 찾기
 * @param {*} socket
 * @param {*} io
 * @param {*} value
 */
async function findMatching(socket, io, value) {
  log.info("Starting matching process", socket);

  if (socket.highestPriorityNode) {
    while (socket.highestPriorityNode.priorityValue >= value) {
      const otherSocket = await getSocketIdByMemberId(io, socket.highestPriorityNode.memberId);
      if (otherSocket) {
        log.debug("Found other socket with priority exceeding value", socket);

        if (!otherSocket.highestPriorityNode) {
          log.warn("Other socket has no highest priority node", otherSocket);
          return null;
        } else if (otherSocket.highestPriorityNode.priorityValue >= value) {
          log.info("MATCHING FOUND", otherSocket);
          return otherSocket;
        } else {
          log.debug("Checking the previous highest priority node", socket);
          socket.highestPriorityNode =
            socket.highestPriorityNode !== socket.priorityTree.getMaxBeforeNode(socket.priorityTree.root, socket.highestPriorityNode)
              ? socket.highestPriorityNode
              : null;
        }
      } else {
        log.warn("Could not find other socket by matchingUuid", socket);
        return null;
      }
    }
  } else {
    log.warn("No highest priority node found for socket", socket);
  }

  log.info("No matching found for the given threshold", socket);
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

module.exports = {
  updatePriorityTree,
  updateOtherPriorityTrees,
  handleSocketError,
  joinGameModeRoom,
  findMatching,
};
