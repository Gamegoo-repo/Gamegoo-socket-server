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
    log.error("Priority tree not initialized", `socketId:${socket.id}, memberId:${socket.memberId}`);
    return;
  }

  log.info("Updating priority tree", `socketId:${socket.id}, memberId:${socket.memberId}`);

  // 내 소켓에 다른 사용자 우선순위 값 넣기
  for (const item of priorityList) {
    if (!socket.priorityTree.contains(item.memberId)) {
      socket.priorityTree.insert(item.memberId, item.priorityValue);
      log.debug("Inserted new priority into my tree", `memberId:${item.memberId}, priorityValue:${item.priorityValue}`);
    }
  }

  // 내 소켓의 우선순위 최댓값 노드 변경
  if (socket.priorityTree.root) {
    socket.highestPriorityNode = socket.priorityTree.getMax(socket.priorityTree.root);
    log.debug(
      "Highest priority node updated",
      `memberId:${socket.highestPriorityNode?.memberId}, priorityValue:${socket.highestPriorityNode?.priorityValue}`
    );
  }

  log.debug(
    "Socket priority tree (sorted)",
    `memberId:${socket.memberId}, socketId:${socket.id}, sortedList:${JSON.stringify(socket.priorityTree.getSortedList(), null, 2)}`
  );
  if (socket.highestPriorityNode) {
    log.info(
      "Highest priority member in tree",
      `memberId:${socket.highestPriorityNode.memberId}, priorityValue:${socket.highestPriorityNode.priorityValue}`
    );
  } else {
    log.warn("No highest priority node found", `memberId:${socket.memberId}, socketId:${socket.id}`);
  }
}

/**
 * 다른 사용자의 우선순위 트리 갱신
 * @param {*} io
 * @param {*} socket
 * @param {*} otherPriorityList
 * @returns {boolean} 중복 여부
 */
async function updateOtherPriorityTrees(io, socket, otherPriorityList) {
  log.info("Updating other users' priority trees", `socketId:${socket.id}, memberId:${socket.memberId}`);

  for (const item of otherPriorityList) {
    const otherSocket = await getSocketIdByMemberId(io, item.memberId);
    log.debug("Fetched other user's socket", `memberId:${item.memberId}`);

    if (otherSocket) {
      if (!otherSocket.priorityTree) {
        log.error("Other socket has no priority tree", `otherSocketId:${otherSocket.id}, memberId:${otherSocket.memberId}`);
        return;
      }

      // 다른 사용자 소켓에 내 우선순위 값 넣기
      if (!otherSocket.priorityTree.contains(socket.memberId)) {
        otherSocket.priorityTree.insert(socket.memberId, item.priorityValue);
        log.debug("Inserted priority into other user's tree", `memberId:${socket.memberId}, priorityValue:${item.priorityValue}`);
      }
      // 다른 사용자의 우선순위 최댓값 노드 변경
      if (otherSocket.priorityTree.root) {
        otherSocket.highestPriorityNode = otherSocket.priorityTree.getMax(otherSocket.priorityTree.root);
        log.debug(
          "Updated highest priority node for other user",
          `otherMemberId:${otherSocket.memberId}, highestPriorityMemberId:${otherSocket.highestPriorityNode.memberId}`
        );
      }

      log.debug(
        "Other user's priority tree (sorted)",
        `otherMemberId:${otherSocket.memberId}, otherSocketId:${otherSocket.id}, sortedList:${JSON.stringify(
          otherSocket.priorityTree.getSortedList(),
          null,
          2
        )}`
      );
      if (otherSocket.highestPriorityNode) {
        log.info(
          "Other socket's highest priority member",
          `otherMemberId:${otherSocket.memberId}, highestPriorityMemberId:${otherSocket.highestPriorityNode.memberId}, highestPriorityValue:${otherSocket.highestPriorityNode.priorityValue}`
        );
      } else {
        log.warn("No highest priority node found", `otherMemberId:${otherSocket.memberId}, otherSocketId:${otherSocket.id}`);
      }
    }
  }

  log.info("Other users' priority trees updated", `socketId:${socket.id}, memberId:${socket.memberId}`);
}

/**
 * 매칭 상대 찾기
 * @param {*} socket
 * @param {*} io
 * @param {*} value
 * @returns
 */
async function findMatching(socket, io, value) {
  log.info("Starting matching process", `socketId:${socket.id}, memberId:${socket.memberId}, valueThreshold:${value}`);

  if (socket.highestPriorityNode) {
    // 우선순위 값이 value를 넘는 모든 소켓 확인하기
    while (socket.highestPriorityNode.priorityValue >= value) {
      const otherSocket = await getSocketIdByMemberId(io, socket.highestPriorityNode.memberId);
      if (otherSocket) {
        log.debug(
          "Found other socket with priority exceeding value",
          `socketMemberId:${socket.memberId}, otherSocketMemberId:${otherSocket.memberId}, priorityValue:${socket.highestPriorityNode.priorityValue}`
        );

        if (!otherSocket.highestPriorityNode) {
          log.warn("Other socket has no highest priority node", `otherSocketMemberId:${otherSocket.memberId}`);
          return null;
        } else if (otherSocket.highestPriorityNode.priorityValue >= value) {
          log.info("MATCHING FOUND", `matchingSocketId:${otherSocket.id}, matchingMemberId:${otherSocket.memberId}`);
          return otherSocket;
        } else {
          // 최댓값을 가지는 노드의 전 노드 확인
          log.debug("Checking the previous highest priority node", `currentHighestPriorityNode:${socket.highestPriorityNode.memberId}`);
          socket.highestPriorityNode =
            socket.highestPriorityNode !== socket.priorityTree.getMaxBeforeNode(socket.priorityTree.root, socket.highestPriorityNode)
              ? socket.highestPriorityNode
              : null;
        }
      } else {
        log.warn("Could not find other socket by memberId", `highestPriorityMemberId:${socket.highestPriorityNode.memberId}`);
        return null;
      }
    }
  } else {
    log.warn("No highest priority node found for socket", `socketId:${socket.id}, memberId:${socket.memberId}`);
  }

  log.info("No matching found for the given threshold", `socketId:${socket.id}, memberId:${socket.memberId}`);
  return null;
}

/**
 * API 응답 에러 처리
 * @param {*} socket
 * @param {*} error
 */
function handleSocketError(socket, error) {
  if (error instanceof JWTTokenError) {
    log.error("JWT Token Error occurred", `socketId:${socket.id}, memberId:${socket.memberId}, errorCode:${error.code}, errorMessage:${error.message}`);
    emitJWTError(socket, error.code, error.message);
  } else {
    log.error("Error occurred", `socketId:${socket.id}, memberId:${socket.memberId}, errorMessage:${error.message}`);
    emitError(socket, error.message);
  }
}

/**
 * 매칭 룸 입장
 * @param {*} socket
 * @param {*} io
 * @param {*} gameMode
 */
function joinGameModeRoom(socket, io, roomName) {
  socket.join(roomName);

  const usersInRoom = getUsersInRoom(io, roomName);
  console.log(`Room ${roomName} has the following users: ${usersInRoom.join(", ")}`);
  console.log(`User ${socket.id} joined room: ${roomName}`);
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
