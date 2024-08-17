const { fetchMatching } = require("../../apis/matchApi");
const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom } = require("./matchingHandler/matchingStartedHandler");
const { getSocketIdByMemberId } = require("../../common/memberSocketMapper");

/**
 * Matching socket event 관련 리스너
 * @param {*} socket 
 * @param {*} io 
 */
async function setupMatchListeners(socket, io) {
  socket.on("matching_started", async (request) => {
    const gameMode = request.gameMode;

    try {
      const result = await fetchMatching(socket, request);

      // 내 우선순위 트리 갱신
      updatePriorityTree(socket, result.myPriorityList);

      // 다른 사람 우선순위 트리 갱신
      await updateOtherPriorityTrees(io, socket, result.otherPriorityList);

      // priorityTree의 maxNode가 55를 넘는지 확인
      if (socket.highestPriorityValue !== null) {
        if (socket.highestPriorityValue >= 55) {
          // 해당 maxNode의 짝이 55를 넘는지 확인
          const otherSocket = await getSocketIdByMemberId(io, socket.highestPriorityMember);
          if (otherSocket && otherSocket.highestPriorityValue >= 55) {
            socket.emit("matching_found", {
              myMemberId: socket.memberId,
              otherMemberId: socket.highestPriorityMember
            });
          }
        }
      }
    } catch (error) {
      handleSocketError(socket, error);
    }

    joinGameModeRoom(socket, io, gameMode);
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
