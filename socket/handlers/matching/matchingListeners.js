const { fetchMatchingApi, updateMatchingStatusApi, updateBothMatchingStatusApi } = require("../../apis/matchApi");
const {
  updateOtherPriorityTrees,
  updatePriorityTree,
  handleSocketError,
  joinGameModeRoom,
  findMatching,
  deleteSocketFromMatching,
} = require("./matchingHandler/matchingStartedHandler");
const { emitError } = require("../../emitters/errorEmitter");

/**
 * Matching socket event 관련 리스너
 * @param {*} socket
 * @param {*} io
 */
async function setupMatchListeners(socket, io) {
  socket.on("matching_started", async (request) => {
    const gameMode = request.gameMode;
    const roomName = "GAMEMODE_" + gameMode;

    // 2) socket.id가 소켓 룸 "GAMEMODE_" + gameMode에 있는지 확인
    const usersInRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
    // console.log(socket.id, " ", socket.memberId);
    //console.log(usersInRoom);
    if (usersInRoom.has(socket.id)) {
      console.log("ERROR : 이미 매칭을 시도한 소켓입니다.");
      emitError(socket, "You are already in the matching room for this game mode.");
      return;
    }

    // 3) 게임 모드에 따라 소켓룸에 조인
    joinGameModeRoom(socket, io, roomName);

    try {
      // 4) 8080서버에 우선순위 계산 API 요청
      const result = await fetchMatchingApi(socket, request);

      // 5) 내 우선순위 트리 갱신
      updatePriorityTree(socket, result.myPriorityList);

      // 6) 다른 사람 우선순위 트리 갱신
      await updateOtherPriorityTrees(io, socket, result.otherPriorityList);

      // 7) priorityTree의 maxNode가 55를 넘는지 확인
      const otherSocket = await findMatching(socket, io, 55);

      if (otherSocket) {
        // TODO: matching_found emit 보내기 (나 & 상대방 둘 다 보내야함)
        // 9) ~ 11) room leave 및 socket priorityTree 초기화
        deleteSocketFromMatching(socket, io, otherSocket, roomName);

        // 12) 8080서버에 매칭 status 변경 API 요청
        await updateBothMatchingStatusApi(socket, "FOUND", otherSocket.memberId);

        console.log("Matching Found");
      } else {
        // 우선순위 값이 55 이상인 매칭을 못찾았을 경우
        // 2분 후에 findMatching을 다시 실행
        setTimeout(async () => {
          // (#21-8) 우선 순위 값 50점 이상인 노드 확인
          const otherSocket = await findMatching(socket, io, 50);
          if (otherSocket) {
            // TODO: matching_found emit 보내기 (나 & 상대방 둘 다 보내야함)
            // (#21-10) ~ (#21-12) room leave 및 socket priorityTree 초기화
            deleteSocketFromMatching(socket, io, otherSocket, roomName);

            // (#21-13) 8080서버에 매칭 status 변경 API 요청
            await updateBothMatchingStatusApi(socket, "FOUND", otherSocket.memberId);

            console.log("Matching Found after 2 mins : ", socket.memberId, " & ", otherSocket.memberId);
          }
        }, 1 * 15 * 1000); // 2분 = 120,000ms
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

module.exports = { setupMatchListeners };
