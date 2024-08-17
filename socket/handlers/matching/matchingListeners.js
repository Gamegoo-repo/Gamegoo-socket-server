const { fetchMatching } = require("../../apis/matchApi");
const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom } = require("./matchingHandler/matchingStartedHandler");
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
      updatePriorityTree(socket, result.myPriorityList);
      await updateOtherPriorityTrees(io, socket, result.otherPriorityList);
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
  console.log(request);
}

function handleMatchingSuccess(request) {
  console.log(request);
}

function handleMatchingFailed(request) {
  console.log(request);
}

module.exports = { setupMatchListeners };
