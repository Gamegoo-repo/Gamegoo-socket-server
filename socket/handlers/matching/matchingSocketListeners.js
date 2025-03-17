const { handleMatchingRequest, handleMatchingRetry } = require("./matchingHandler/matchingRequestHandler");
const { handleMatchingFoundSuccess, handleMatchingSuccessReceiver, handleMatchingSuccessFinal } = require("./matchingHandler/matchingSuccessHandler");
const {handleMatchingReject, handleMatchingNotFound, handleMatchingFail, handleMatchingQuit} = require("./matchingHandler/matchingFailHandler");

/**
 * Socket 이벤트 리스너 등록
 */
function setupMatchSocketListeners(socket, io) {
  socket.on("matching-request", (request) => handleMatchingRequest(socket, io, request));
  socket.on("matching-retry", (request) => handleMatchingRetry(socket, io, request));
  socket.on("matching-found-success", (request) => handleMatchingFoundSuccess(socket, io, request));
  socket.on("matching-success-receiver", (request) => handleMatchingSuccessReceiver(io, request));
  socket.on("matching-success-final", () => handleMatchingSuccessFinal(socket, io));
  socket.on("matching-not-found", () => handleMatchingNotFound(socket, io));
  socket.on("matching-reject", () => handleMatchingReject(socket, io));
  socket.on("matching-fail", () => handleMatchingFail(socket));
  socket.on("matching-quit", () => handleMatchingQuit(socket, io));
}

module.exports = { setupMatchSocketListeners };   