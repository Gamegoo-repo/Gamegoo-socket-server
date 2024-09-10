const { fetchMatchingApi, matchingFoundApi, matchingSuccessApi, updateMatchingStatusApi, updateBothMatchingStatusApi } = require("../../apis/matchApi");

const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom, findMatching } = require("./matchingHandler/matchingStartedHandler");
const { isSocketActiveAndInRoom } = require("./matchingHandler/matchingCommonHandler");
const { deleteSocketFromMatching, deleteMySocketFromMatching } = require("./matchingHandler/matchingFoundHandler");

const { emitError } = require("../../emitters/errorEmitter");
const {
  emitMatchingStarted,
  emitMatchingFoundReceiver,
  emitMatchingFoundSender,
  emitMatchingSuccessSender,
  emitMatchingSuccess,
  emitMatchingFail
} = require("../../emitters/matchingEmitter");

const { getSocketIdByMemberId } = require("../../common/memberSocketMapper");

//const eventEmitter = require("../../events/eventBus");

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

    // 2) socket.id가 소켓 룸 "GAMEMODE_" + gameMode에 있는지 확인
    const usersInRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
    if (usersInRoom.has(socket.id)) {
      console.log("ERROR : 이미 매칭을 시도한 소켓입니다.");
      emitError(socket, "You are already in the matching room for this game mode.");
      return;
    }

    // 3) 게임 모드에 따라 room에 join
    joinGameModeRoom(socket, io, roomName);

    try {
      // 4) 8080서버에 우선순위 계산 API 요청
      const result = await fetchMatchingApi(socket, request);
      socket.myMatchingInfo = result.myMatchingInfo;

      // 6) API 정상 응답 받음
      if (result) {
        // 7) "matching-started" emit
        emitMatchingStarted(socket, result.myMatchingInfo);

        // 8) 내 우선순위 트리 갱신
        updatePriorityTree(socket, result.myPriorityList);

        // 9) room에 있는 모든 socket의 우선순위 트리 갱신
        await updateOtherPriorityTrees(io, socket, result.otherPriorityList);
      }

      // 10) priorityTree의 maxNode가 55를 넘는지 확인
      const receiverSocket = await findMatching(socket, io, 50);

      if (receiverSocket) {
        // 11) receiverSocket이 매칭 room에 존재하는지 여부 확인
        isSocketActiveAndInRoom(receiverSocket, io, roomName);

        // 12) "matching-found-receiver" emit
        emitMatchingFoundReceiver(receiverSocket, socket.myMatchingInfo);
      }
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  // receiver가 보낸 "matching-found-success" listener
  socket.on("matching-found-success", async (request) => {
    // senderSocket 객체 찾기
    const senderSocket = await getSocketIdByMemberId(io, request.senderMemberId);

    // 15) 각 socket의 matchingTarget 값 바인딩
    socket.matchingTarget = senderSocket.memberId;
    senderSocket.matchingTarget = socket.memberId;

    // 16 ~ 18) room leave, 다른 socket들의 priorityTree에서 제거, 두 socket의 priorityTree 초기화
    const roomName = "GAMEMODE_" + request.gameMode;
    deleteSocketFromMatching(socket, io, senderSocket, roomName);

    // 19) 8080서버에 매칭 FOUND API 요청
    try {
      const result = await matchingFoundApi(socket, senderSocket.memberId);

      // 20) API 정상 응답 받음
      if (result) {
        // 21) "matching-found-sender" emit
        emitMatchingFoundSender(senderSocket, result.myMatchingInfo);
      }
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  // receiver가 보낸 matching-success-receiver listener
  socket.on("matching-success-receiver", async () => {
    const senderSocket = await getSocketIdByMemberId(io, socket.matchingTarget);

    // 23) sender socket에게 matching-success-sender emit
    if (senderSocket) {
      emitMatchingSuccessSender(senderSocket);
    }
  });

  // sender가 보낸 matching-success-final listener
  socket.on("matching-success-final", async () => {
    console.log("================= matching_success_final ======================");

    // receiverSocket 객체 찾기
    const receiverSocket = await getSocketIdByMemberId(io, socket.matchingTarget);

    if (receiverSocket) {
      // 25) 8080서버에 매칭 성공 API 요청
      try {
        const result = await matchingSuccessApi(socket, receiverSocket.memberId);

        // 26) API 정상 응답 받음
        if (result) {
          // 27) 두 socket을 chatroom에 join
          socket.join("CHAT_" + result);
          receiverSocket.join("CHAT_" + result);

          // 28) matching-success emit
          emitMatchingSuccess(socket, receiverSocket, result);
        }
      } catch (error) {
        handlerSocketError(socket, error);
      }
    }
  });

  socket.on("matching-reject", async (request) => {
    console.log("================= matching_reject ======================");
    const otherSocket = await getSocketIdByMemberId(io, socket.matchingTarget);

    // 26) 매칭 REJECT API 요청 (상대, 나 둘 다 status 변경하기)
    await updateBothMatchingStatusApi(socket, "FAIL", socket.matchingTarget);

    // 27) 상대 client에게 matching-fail emit
    if (otherSocket) {
      emitMatchingFail(otherSocket);
      emitMatchingFail(socket);

    }
    // 28) socket.target 제거
    socket.matchingTarget = null;

    // 29) otherSocket.matchingTarget 제거
    if (otherSocket) {
      otherSocket.matchingTarget = null;
    }
  });

  socket.on("matching-fail", async (request) => {
    console.log("================= matching_fail ======================");
    const otherSocket = await getSocketIdByMemberId(io, socket.matchingTarget);

    // 26) 매칭 FAIL API 요청
    await updateBothMatchingStatusApi(socket, "FAIL", socket.matchingTarget);

    // 27) 상대 client에게 matching-fail emit
    if (otherSocket) {
      emitMatchingFail(otherSocket);
    }
    // 28) socket.target 제거
    socket.matchingTarget = null;

    console.log("socket: "+socket);
    console.log(socket);
    // 29) otherSocket.matchingTarget 제거
    if (otherSocket) {
      otherSocket.matchingTarget = null;
    }
  });

  socket.on("matching-retry", async (request) => {
    console.log("================= matching_retry ======================");
    console.log("member ID:", socket.memberId);
    console.log("priority : ", request.priority);
    const roomName = socket.roomName;


    // 10) priorityTree의 maxNode가 request.priority를 넘는지 확인
    const receiverSocket = await findMatching(socket, io, request.priority);

    if (receiverSocket) {
      // 11) receiverSocket이 매칭 room에 존재하는지 여부 확인
      isSocketActiveAndInRoom(receiverSocket, io, roomName);

      // 12) "matching-found-receiver" emit
      emitMatchingFoundReceiver(receiverSocket, socket.myMatchingInfo);
    }


  })

  // Flow #22
  socket.on("matching-not-found", async (request) => {
    console.log("================= matching_not_found ======================");
    // 14 ~ 16) room leave, 다른 socket들의 priorityTree에서 제거, 두 socket의 priorityTree 초기화
    const roomName = socket.roomName;
    deleteMySocketFromMatching(socket, io, roomName);

    // 17) matching_status 변경
    try {
      const result = await updateMatchingStatusApi(socket, "FAIL");
      if (result) {
        console.log("Matching Not Found 처리 완료");
      }
    } catch (error) {
      handlerSocketError(socket, error);
    }
  })

}

module.exports = { setupMatchSocketListeners };
