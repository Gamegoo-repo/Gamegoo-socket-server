const { fetchMatchingApi, matchingFoundApi, matchingSuccessApi, updateMatchingStatusApi, updateBothMatchingStatusApi } = require("../../apis/matchApi");

const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom, findMatching } = require("./matchingHandler/matchingStartedHandler");
const { isSocketActiveAndInRoom } = require("./matchingHandler/matchingCommonHandler");
const { deleteMySocketFromMatching } = require("./matchingHandler/matchingFoundHandler");

const { emitError } = require("../../emitters/errorEmitter");

const logger = require("../../../common/winston");

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
 * Matching socket event 관련 리스너
 * @param {*} socket
 * @param {*} io
 */
async function setupMatchSocketListeners(socket, io) {
  socket.on("matching-request", async (request) => {
    const gameMode = request.gameMode;
    socket.gameMode = gameMode;
    const roomName = "GAMEMODE_" + gameMode;
    socket.roomName = roomName;
    logger.info("=== Received 'matching-request' event", `from socketId:${socket.id}, gameMode:${gameMode} ===`);

    // 2) socket.id가 소켓 룸 "GAMEMODE_" + gameMode에 있는지 확인
    const usersInRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
    if (usersInRoom.has(socket.id)) {
      logger.error("Socket already in matching room", `socketId:${socket.id}, roomName:${roomName}`);
      emitError(socket, "You are already in the matching room for this game mode.");
      return;
    }

    // 3) 게임 모드에 따라 room에 join
    logger.info("Joining game mode room", `socketId:${socket.id}, roomName:${roomName}`);
    joinGameModeRoom(socket, io, roomName);

    try {
      // 4) 8080서버에 우선순위 계산 API 요청
      logger.http("Sending priority calculation request to matching API", `socketId:${socket.id}, gameMode:${gameMode}`);
      const result = await fetchMatchingApi(socket, request);
      socket.myMatchingInfo = result.myMatchingInfo;
      logger.info("Received matching API response", `socketId:${socket.id}, matchingInfo:${JSON.stringify(result.myMatchingInfo)}`);

      // 6) API 정상 응답 받음
      if (result) {
        // 7) "matching-started" emit
        emitMatchingStarted(socket, result.myMatchingInfo);

        // 8) 내 우선순위 트리 갱신
        logger.debug("Updating my priority tree", `socketId:${socket.id}`);
        updatePriorityTree(socket, result.myPriorityList);

        // 9) room에 있는 모든 socket의 우선순위 트리 갱신
        logger.debug("Updating priority trees for other sockets in room", `socketId:${socket.id}, roomName:${roomName}`);
        await updateOtherPriorityTrees(io, socket, result.otherPriorityList);
      }

      // 10) priorityTree의 maxNode가 50를 넘는지 확인
      logger.debug("Checking for matching receiver with maxNode > 50", `socketId:${socket.id}`);
      const receiverSocket = await findMatching(socket, io, 50);

      if (receiverSocket) {
        // 11) receiverSocket이 매칭 room에 존재하는지 여부 확인
        logger.debug("Checking if receiverSocket is active and in room", `receiverSocketId:${receiverSocket.id}, roomName:${roomName}`);
        isSocketActiveAndInRoom(receiverSocket, io, roomName);

        // 12) "matching-found-receiver" emit
        emitMatchingFoundReceiver(receiverSocket, socket.myMatchingInfo);
      }

      logger.info("=== Completed 'matching-request' event processing", `socketId:${socket.id} ===`);
    } catch (error) {
      handleSocketError(socket, error, "matching-request", request);
      logger.error("Error occurred during matching process, 'matching-request' listener", `socketId:${socket.id}, error:${error.message}`);
      handleSocketError(socket, error);
    }
  });

  // receiver가 보낸 "matching-found-success" listener
  socket.on("matching-found-success", async (request) => {
    logger.info(
      "=== Received 'matching-found-success' event",
      `socketId:${socket.id}, gameMode:${request.gameMode}, senderMemberId:${request.senderMemberId} ===`
    );
    // senderSocket 객체 찾기
    const senderSocket = await getSocketIdByMemberId(io, request.senderMemberId);
    if (!senderSocket) {
      logger.error("Sender socket not found", `senderMemberId:${request.senderMemberId}, gameMode:${request.gameMode}`);
      return;
    }
    logger.debug("Sender socket found", `senderSocketId:${senderSocket.id}, senderMemberId:${senderSocket.memberId}`);

    // 15) 각 socket의 matchingTarget 값 바인딩
    socket.matchingTarget = senderSocket.memberId;
    senderSocket.matchingTarget = socket.memberId;
    logger.info("Bound matchingTarget values", `receiverMemberId:${socket.memberId}, senderMemberId:${senderSocket.memberId}`);

    // 16 ~ 18) room leave, 다른 socket들의 priorityTree에서 제거, 두 socket의 priorityTree 초기화
    const roomName = "GAMEMODE_" + request.gameMode;
    logger.info("Removing sockets from matching room", `roomName:${roomName}`);
    deleteMySocketFromMatching(socket, io, roomName);
    deleteMySocketFromMatching(senderSocket, io, roomName);
    logger.debug("Sockets removed from room and priority trees cleared", `receiverSocketId:${socket.id}, senderSocketId:${senderSocket.id}`);

    // 19) 8080서버에 매칭 FOUND API 요청
    try {
      logger.http("Sending matching FOUND API request", `receiverMemberId:${socket.memberId}, senderMemberId:${senderSocket.memberId}`);
      const result = await matchingFoundApi(socket, senderSocket.memberId);

      // 20) API 정상 응답 받음
      if (result) {
        logger.info("Received matching FOUND API response", `receiverMemberId:${socket.memberId}, senderMemberId:${senderSocket.memberId}`);
        // 21) "matching-found-sender" emit
        emitMatchingFoundSender(senderSocket, result.myMatchingInfo);
      }
    } catch (error) {
      logger.error("Error during matching FOUND API request", `socketId:${socket.id}, error:${error.message}`);
      handleSocketError(socket, error);
    }

    logger.info("=== Completed 'matching-found-success' event processing", `socketId:${socket.id} ===`);
  });

  // receiver가 보낸 matching-success-receiver listener
  socket.on("matching-success-receiver", async () => {
    logger.info("=== Received 'matching-success-receiver' event ", `socketId:${socket.id}, memberId:${socket.memberId} ===`);
    const senderSocket = await getSocketIdByMemberId(io, socket.matchingTarget);
    if (!senderSocket) {
      logger.warn("Sender socket not found", `matchingTarget:${socket.matchingTarget}, receiverSocketId:${socket.id}`);
      return;
    }

    logger.debug("Found sender socket", `senderSocketId:${senderSocket.id}, matchingTarget:${socket.matchingTarget}`);

    // 23) sender socket에게 matching-success-sender emit
    if (senderSocket) {
      emitMatchingSuccessSender(senderSocket);
    }
    logger.info("=== Completed 'matching-success-receiver' event processing", `socketId:${socket.id} ===`);
  });

  // sender가 보낸 matching-success-final listener
  socket.on("matching-success-final", async () => {
    logger.info("=== Received 'matching-success-final' event", `socketId:${socket.id}, memberId:${socket.memberId} ===`);

    // receiverSocket 객체 찾기
    const receiverSocket = await getSocketIdByMemberId(io, socket.matchingTarget);

    if (!receiverSocket) {
      logger.warn("Receiver socket not found", `matchingTarget:${socket.matchingTarget}, socketId:${socket.id}`);
      return;
    }

    logger.debug("Found receiver socket", `receiverSocketId:${receiverSocket.id}, matchingTarget:${socket.matchingTarget}`);

    // 25) 8080서버에 매칭 성공 API 요청
    try {
      logger.http("Sending 'matching success' API request", `senderMemberId:${socket.memberId}, receiverMemberId:${receiverSocket.memberId}`);
      const result = await matchingSuccessApi(socket, receiverSocket.memberId);

      // 26) API 정상 응답 받음
      if (result) {
        logger.info(
          "Received successful response from 'matching success' API",
          `chatroomId:${result}, senderMemberId:${socket.memberId}, receiverMemberId:${receiverSocket.memberId}`
        );

        // 27) 두 socket을 chatroom에 join
        socket.join("CHAT_" + result);
        receiverSocket.join("CHAT_" + result);
        logger.info("Both sockets joined chatroom", `chatroomId:${result}, senderSocketId:${socket.id}, receiverSocketId:${receiverSocket.id}`);

        // 28) matching-success emit
        emitMatchingSuccess(socket, receiverSocket, result);
        logger.info("=== Completed 'matching-success-final' event processing", `socketId:${socket.id} ===`);
      }
    } catch (error) {
      logger.error("Error occurred during 'matching-success' API request", `socketId:${socket.id}, errorMessage:${error.message}`);
      handleSocketError(socket, error);
    }
  });

  socket.on("matching-reject", async () => {
    logger.info("=== Received 'matching-reject' event", `socketId:${socket.id}, memberId:${socket.memberId}, gameMode:${socket.gameMode} ===`);
    const otherSocket = await getSocketIdByMemberId(io, socket.matchingTarget);
    if (!otherSocket) {
      logger.warn("Other socket not found for matchingTarget", `matchingTarget:${socket.matchingTarget}, socketId:${socket.id}`);
    } else {
      logger.debug("Found other socket", `otherSocketId:${otherSocket.id}, matchingTarget:${socket.matchingTarget}`);
    }

    if (socket.gameMode != null) {
      try {
        // 26) 매칭 REJECT API 요청 (상대, 나 둘 다 status 변경하기)
        logger.http("Sending 'matching reject' API request", `senderMemberId:${socket.memberId}, targetMemberId:${socket.matchingTarget}`);
        await updateBothMatchingStatusApi(socket, "FAIL", socket.matchingTarget);
        logger.info("Successfully updated matching status for both users", `senderMemberId:${socket.memberId}, targetMemberId:${socket.matchingTarget}`);
      } catch (error) {
        logger.error("Error during 'matching reject' API request", `socketId:${socket.id}, errorMessage:${error.message}`);
        handleSocketError(socket, error);
      }
    }

    // 27) 상대 client에게 matching-fail emit
    if (otherSocket) {
      emitMatchingFail(otherSocket);
    }
    emitMatchingFail(socket);

    // 28) socket.target 제거
    socket.matchingTarget = null;
    logger.debug("Removed matchingTarget from socket", `socketId:${socket.id}`);

    // 29) otherSocket.matchingTarget 제거
    if (otherSocket) {
      otherSocket.matchingTarget = null;
      logger.debug("Removed matchingTarget from otherSocket", `otherSocketId:${otherSocket.id}`);
    }
    logger.info("=== Completed 'matching-reject' event processing", `socketId:${socket.id} ===`);
  });

  socket.on("matching-fail", async () => {
    logger.info("=== Received 'matching-fail' event", `socketId:${socket.id}, memberId:${socket.memberId}, gameMode:${socket.gameMode} ===`);
    if (socket.gameMode != null) {
      try {
        // 24) 매칭 FAIL API 요청 (나의 status만 변경)
        await updateMatchingStatusApi(socket, "FAIL");
      } catch (error) {
        logger.error("Error during 'matching fail' API request", `socketId:${socket.id}, errorMessage:${error.message}`);
        handleSocketError(socket, error);
        return; // 에러 발생 시 이후 작업 중단
      }
    }
    // 26) socket.target 제거
    socket.matchingTarget = null;
    logger.debug("Removed matchingTarget from socket", `socketId:${socket.id}`);

    // 27) matching-fail emit
    emitMatchingFail(socket);
    logger.info("=== Completed 'matching-fail' event processing", `socketId:${socket.id} ===`);
  });

  socket.on("matching-quit", async () => {
    logger.info("=== Received 'matching-quit' event", `socketId:${socket.id}, memberId:${socket.memberId}, gameMode:${socket.gameMode} ===`);

    if (socket.gameMode != null) {
      try {
        logger.http("Sending 'matching quit' API request to update status", `socketId:${socket.id}, memberId:${socket.memberId}`);
        // 2) 매칭 FAIL API 요청 (나의 status만 변경)
        await updateMatchingStatusApi(socket, "QUIT");
        logger.info("Successfully updated matching status to 'QUIT'", `socketId:${socket.id}, memberId:${socket.memberId}`);
      } catch (error) {
        logger.error("Error during 'matching quit' API request", `socketId:${socket.id}, errorMessage:${error.message}`);
        handleSocketError(socket, error);
        return;
      }
    }

    // 4~6) room leave, 다른 socket들의 priorityTree에서 제거, 두 socket의 priorityTree 초기화
    const roomName = "GAMEMODE_" + socket.gameMode;
    logger.info("Leaving room and clearing priority trees", `roomName:${roomName}, socketId:${socket.id}`);
    deleteMySocketFromMatching(socket, io, roomName);
    logger.info("=== Completed 'matching-quit' event processing", `socketId:${socket.id} ===`);
  });

  socket.on("matching-retry", async (request) => {
    logger.info("=== Received 'matching-retry' event", `socketId:${socket.id}, memberId:${socket.memberId}, priority:${request.priority} ===`);
    const roomName = socket.roomName;
    try {
      logger.debug(
        "Checking for receiver with priority higher than request",
        `socketId:${socket.id}, memberId:${socket.memberId}, requestedPriority:${request.priority}`
      );
      // 10) priorityTree의 maxNode가 request.priority를 넘는지 확인
      const receiverSocket = await findMatching(socket, io, request.priority);
      if (receiverSocket) {
        // 11) receiverSocket이 매칭 room에 존재하는지 여부 확인
        const isActive = isSocketActiveAndInRoom(receiverSocket, io, roomName);
        if (isActive) {
          logger.info("Receiver socket found and is active in room", `receiverSocketId:${receiverSocket.id}, roomName:${roomName}`);

          // 12) "matching-found-receiver" emit
          emitMatchingFoundReceiver(receiverSocket, socket.myMatchingInfo);
        } else {
          logger.warn("Receiver socket is not active in room", `receiverSocketId:${receiverSocket.id}, roomName:${roomName}`);
        }
      } else {
        logger.debug("No receiver socket found with higher priority than requested", `socketId:${socket.id}, requestedPriority:${request.priority}`);
      }
      logger.info("=== Completed 'matching-retry' event processing", `socketId:${socket.id} ===`);
    } catch (error) {
      logger.error("Error during 'matching-retry' process", `socketId:${socket.id}, errorMessage:${error.message}`);
      handleSocketError(socket, error);
    }
  });

  // Flow #22
  socket.on("matching-not-found", async () => {
    logger.info("=== Received 'matching-not-found' event", `socketId:${socket.id}, memberId:${socket.memberId}, gameMode:${socket.gameMode} ===`);
    // 14 ~ 16) room leave, 다른 socket들의 priorityTree에서 제거, 두 socket의 priorityTree 초기화
    const roomName = socket.roomName;
    logger.info("Removing socket from room and clearing priority trees", `socketId:${socket.id}, roomName:${roomName}`);

    deleteMySocketFromMatching(socket, io, roomName);

    // 17) matching_status 변경
    try {
      if (socket.gameMode != null) {
        logger.http("Sending 'matching fail' API request to update status", `socketId:${socket.id}, memberId:${socket.memberId}`);
        const result = await updateMatchingStatusApi(socket, "FAIL");

        if (result) {
          logger.info("Successfully updated matching status to 'FAIL'", `socketId:${socket.id}, memberId:${socket.memberId}`);
        }
      }
    } catch (error) {
      logger.error("Error during 'matching-not-found' API request", `socketId:${socket.id}, errorMessage:${error.message}`);
      handleSocketError(socket, error);
    }
  });
}

module.exports = { setupMatchSocketListeners };
