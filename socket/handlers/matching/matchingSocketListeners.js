const { fetchMatchingApi, matchingFoundApi } = require("../../apis/matchApi");

const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom, findMatching } = require("./matchingHandler/matchingStartedHandler");
const { isSocketActiveAndInRoom } = require("./matchingHandler/matchingCommonHandler");
const { deleteSocketFromMatching } = require("./matchingHandler/matchingFoundHandler");

const { emitError } = require("../../emitters/errorEmitter");
const { emitMatchingStarted, emitMatchingFoundReceiver, emitMatchingFoundSender } = require("../../emitters/matchingEmitter");

const { getSocketIdByMemberId } = require("../../common/memberSocketMapper");

//const eventEmitter = require("../../events/eventBus");

/**
 * Matching socket event 관련 리스너
 * @param {*} socket
 * @param {*} io
 */
async function setupMatchSocketListeners(socket, io) {
  socket.on("matching_request", async (request) => {
    const gameMode = request.gameMode;
    const roomName = "GAMEMODE_" + gameMode;

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

      // 6) API 정상 응답 받음
      if (result) {
        // 7) "matching_started" emit
        emitMatchingStarted(socket, result.myMatchingInfo);

        // 8) 내 우선순위 트리 갱신
        updatePriorityTree(socket, result.myPriorityList);

        // 9) room에 있는 모든 socket의 우선순위 트리 갱신
        await updateOtherPriorityTrees(io, socket, result.otherPriorityList);
      }

      // 10) priorityTree의 maxNode가 55를 넘는지 확인
      const receiverSocket = await findMatching(socket, io, 55);

      if (receiverSocket) {
        // 11) receiverSocket이 매칭 room에 존재하는지 여부 확인
        isSocketActiveAndInRoom(receiverSocket, io, roomName);

        // 12) "matching_found_receiver" emit
        emitMatchingFoundReceiver(receiverSocket, result.myMatchingInfo);
      }
      // else {
      //   // 우선순위 값이 55 이상인 매칭을 못찾았을 경우
      //   // 2분 후에 findMatching을 다시 실행
      //   setTimeout(async () => {
      //     console.log(`================ setTimeout callback called, memberId:${socket.memberId} ================`);

      //     // (#21-8) 우선 순위 값 50점 이상인 노드 확인
      //     const receiverSocket = await findMatching(socket, io, 50);

      //     if (receiverSocket) {
      //       console.log("Matching Found after 2 mins : ", socket.memberId, " & ", receiverSocket.memberId);

      //       // EventEmitter로 'event_matching_found' 이벤트 발생
      //       eventEmitter.emit("event_matching_found", socket, receiverSocket, roomName);
      //     }
      //   }, 1 * 30 * 1000); // 2분 = 120,000ms
      // }
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  // receiver가 보낸 "matching_found_success" listener
  socket.on("matching_found_success", async (request) => {
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
        // 21) "matching_found_sender" emit
        emitMatchingFoundSender(senderSocket, result.myMatchingInfo);
      }
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("matching_found", handleMatchingFound);
  socket.on("matching_success", handleMatchingSuccess);
  socket.on("matching_failed", handleMatchingFailed);
}

function handleMatchingFound(request) {
  console.log("matching_found", request);
}

function handleMatchingSuccess(request) {
  console.log(request);
}

function handleMatchingFailed(request) {
  console.log(request);
}

module.exports = { setupMatchSocketListeners };
