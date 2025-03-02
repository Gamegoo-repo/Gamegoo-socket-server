const { fetchMatchingApi, matchingFoundApi, matchingSuccessApi, updateMatchingStatusApi, updateBothMatchingStatusApi } = require("../../apis/matchApi");
const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom, findMatching } = require("./matchingHandler/matchingStartedHandler");
const { isSocketActiveAndInRoom } = require("./matchingHandler/matchingCommonHandler");
const { deleteMySocketFromMatching } = require("./matchingHandler/matchingFoundHandler");
const { emitError } = require("../../emitters/errorEmitter");
const log = require("../../../common/customLogger");

const {
  emitMatchingStarted,
  emitMatchingFoundReceiver,
  emitMatchingFoundSender,
  emitMatchingSuccessSender,
  emitMatchingSuccess,
  emitMatchingFail,
} = require("../../emitters/matchingEmitter");

const { getSocketIdByMemberId } = require("../../common/memberSocketMapper");

/**
 * "matching-request" - 매칭 요청 핸들러
 */
async function handleMatchingRequest(socket,io,request) {
  const gameMode = request.gameMode;
  socket.data.gameMode = gameMode;
  const roomName = "GAMEMODE_" + gameMode;
  socket.data.roomName = roomName;
  socket.data.memberId=request.memberId;
  
  log.info("matching-request", socket);

  // 2) socket.id가 소켓 룸 "GAMEMODE_" + gameMode에 있는지 확인
  const usersInRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
  if (usersInRoom.has(socket.id)) {
    emitError(socket, "You are already in the matching room for this game mode.");
    return;
  }

  // 3) 게임 모드에 따라 room에 join
  joinGameModeRoom(socket, io, roomName);
  try {
    // 4) 8080서버에 우선순위 계산 API 요청
    const result = await fetchMatchingApi(socket, request);
    socket.data.myMatchingInfo = result.myMatchingInfo;

    console.log(result);
    // 6) API 정상 응답 받음
    if (result) {
      // 7) "matching-started" emit
      emitMatchingStarted(socket, result.myMatchingInfo);

      // 8) 내 우선순위 트리 갱신
      updatePriorityTree(socket, result.myPriorityList);

      // 9) room에 있는 모든 socket의 우선순위 트리 갱신
      await updateOtherPriorityTrees(io, socket, result.otherPriorityList);
    }
    console.log(socket.myMatchingInfo);

    // 10) priorityTree의 maxNode가 50를 넘는지 확인
    // const receiverSocket = await findMatching(socket, io, 50);

    // if (receiverSocket) {
    //   // 11) receiverSocket이 매칭 room에 존재하는지 여부 확인
    //   isSocketActiveAndInRoom(receiverSocket, io, roomName);

    //   // 12) "matching-found-receiver" emit
    //   emitMatchingFoundReceiver(receiverSocket, socket.myMatchingInfo);
    // }

  } catch (error) {
    console.log(error);
    handleSocketError(socket, error);
  }
}

/**
 * 매칭 성공 요청 핸들러 (receiver가 보냄)
 */
async function handleMatchingFoundSuccess(socket, io, request) {
  log.info(`Received 'matching-found-success' from socketId:${socket.id}, senderMemberId:${request.senderMemberId}`);

  const senderSocket = await getSocketIdByMemberId(io, request.senderMemberId);
  if (!senderSocket) {
    log.error(`Sender socket not found for senderMemberId:${request.senderMemberId}`);
    return;
  }

  socket.matchingTarget = senderSocket.memberId;
  senderSocket.matchingTarget = socket.memberId;

  const roomName = "GAMEMODE_" + request.gameMode;
  deleteMySocketFromMatching(socket, io, roomName);
  deleteMySocketFromMatching(senderSocket, io, roomName);

  try {
    const result = await matchingFoundApi(socket, senderSocket.memberId);
    if (result) {
      emitMatchingFoundSender(senderSocket, result.myMatchingInfo);
    }
  } catch (error) {
    log.error(`Error in 'matching-found-success' for socketId:${socket.id}, error: ${error.message}`);
    handleSocketError(socket, error);
  }
}

/**
 * 매칭 성공 최종 단계 핸들러 (sender가 보냄)
 */
async function handleMatchingSuccessFinal(socket, io) {
  log.info(`Received 'matching-success-final' from socketId:${socket.id}`);

  const receiverSocket = await getSocketIdByMemberId(io, socket.matchingTarget);
  if (!receiverSocket) {
    log.warn(`Receiver socket not found for matchingTarget:${socket.matchingTarget}`);
    return;
  }

  try {
    const result = await matchingSuccessApi(socket, receiverSocket.memberId);
    if (result) {
      socket.join("CHAT_" + result);
      receiverSocket.join("CHAT_" + result);
      emitMatchingSuccess(socket, receiverSocket, result);
    }
  } catch (error) {
    log.error(`Error in 'matching-success-final' for socketId:${socket.id}, error: ${error.message}`);
    handleSocketError(socket, error);
  }
}

/**
 * 매칭 거절 핸들러
 */
async function handleMatchingReject(socket, io) {
  log.info(`Received 'matching-reject' from socketId:${socket.id}`);

  const otherSocket = await getSocketIdByMemberId(io, socket.matchingTarget);
  if (socket.gameMode) {
    try {
      await updateBothMatchingStatusApi(socket, "FAIL", socket.matchingTarget);
    } catch (error) {
      log.error(`Error in 'matching-reject' for socketId:${socket.id}, error: ${error.message}`);
      handleSocketError(socket, error);
    }
  }

  if (otherSocket) {
    emitMatchingFail(otherSocket);
    otherSocket.matchingTarget = null;
  }

  emitMatchingFail(socket);
  socket.matchingTarget = null;
}

/**
 * 매칭 실패 핸들러
 */
async function handleMatchingFail(socket) {
  log.info(`Received 'matching-fail' from socketId:${socket.id}`);

  if (socket.gameMode) {
    try {
      await updateMatchingStatusApi(socket, "FAIL");
    } catch (error) {
      log.error(`Error in 'matching-fail' for socketId:${socket.id}, error: ${error.message}`);
      handleSocketError(socket, error);
      return;
    }
  }

  socket.matchingTarget = null;
  emitMatchingFail(socket);
}

/**
 * 매칭 종료 핸들러
 */
async function handleMatchingQuit(socket, io) {
  log.info(`Received 'matching-quit' from socketId:${socket.id}`);

  if (socket.gameMode) {
    try {
      await updateMatchingStatusApi(socket, "QUIT");
    } catch (error) {
      log.error(`Error in 'matching-quit' for socketId:${socket.id}, error: ${error.message}`);
      handleSocketError(socket, error);
      return;
    }
  }

  deleteMySocketFromMatching(socket, io, socket.roomName);
}

/**
 * Socket 이벤트 리스너 등록
 */
function setupMatchSocketListeners(socket, io) {
  socket.on("matching-request", (request) => handleMatchingRequest(socket, io, request));
  socket.on("matching-found-success", (request) => handleMatchingFoundSuccess(socket, io, request));
  socket.on("matching-success-final", () => handleMatchingSuccessFinal(socket, io));
  socket.on("matching-reject", () => handleMatchingReject(socket, io));
  socket.on("matching-fail", () => handleMatchingFail(socket));
  socket.on("matching-quit", () => handleMatchingQuit(socket, io));
}

module.exports = { setupMatchSocketListeners };