const { fetchMatching } = require("../../apis/matchApi");
const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom, findMatching } = require("./matchingHandler/matchingStartedHandler");
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

    // socket.memberId가 소켓 룸 "GAMEMODE_" + gameMode에 있는지 확인
    const usersInRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
    console.log(usersInRoom);
    if (usersInRoom.has(socket.id)) {
      console.log("DDD");
      emitError(socket, "You are already in the matching room for this game mode.");
      return;
    }

    try {
      const result = await fetchMatching(socket, request);

      // 내 우선순위 트리 갱신
      updatePriorityTree(socket, result.myPriorityList);

      // 다른 사람 우선순위 트리 갱신
      await updateOtherPriorityTrees(io, socket, result.otherPriorityList);

      // priorityTree의 maxNode가 55를 넘는지 확인
      await findMatching(socket, io, 55);

      // 2분 후에 findMatching을 다시 실행
      setTimeout(async () => {
        await findMatching(socket, io, 50);
      }, 30 * 1000); // 2분 = 120,000ms

    } catch (error) {
      handleSocketError(socket, error);
    }

    joinGameModeRoom(socket, io, roomName);
  });

  socket.on("matching_found", handleMatchingFound);
  socket.on("matching_success", handleMatchingSuccess);
  socket.on("matching_failed", handleMatchingFailed);
}



function handleMatchingFound(request) {
  console.log("matching_found",request);
}

function handleMatchingSuccess(request) {
  console.log(request);
}

function handleMatchingFailed(request) {
  console.log(request);
}

module.exports = { setupMatchListeners };
