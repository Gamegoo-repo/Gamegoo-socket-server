const formatResponse = require("../common/responseFormatter");

/**
 * 해당 socket의 매칭 요청이 정상 접수되었음을 전달
 * @param {*} socket
 * @param {*} myMatchingInfo
 */
function emitMatchingStarted(socket, myMatchingInfo) {
  socket.emit("matching-started", formatResponse("matching-started", myMatchingInfo));
}

/**
 * 해당 receiver socket에게 매칭 상대가 정해졌음을 전달
 * @param {*} socket
 * @param {*} targetMatchingInfo
 */
function emitMatchingFoundReceiver(socket, targetMatchingInfo) {
  socket.emit("matching-found-receiver", formatResponse("matching-found-receiver", targetMatchingInfo));
}

/**
 * 해당 sender socket에게 매칭 상대가 정해졌음을 전달
 * @param {*} socket
 * @param {*} targetMatchingInfo
 */
function emitMatchingFoundSender(socket, targetMatchingInfo) {
  socket.emit("matching-found-sender", formatResponse("matching-found-sender", targetMatchingInfo));
}

module.exports = {
  emitMatchingStarted,
  emitMatchingFoundReceiver,
  emitMatchingFoundSender,
};
