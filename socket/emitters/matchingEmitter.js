const formatResponse = require("../common/responseFormatter");
const log = require("../../common/customLogger");

/**
 * 해당 socket의 매칭 요청이 정상 접수되었음을 전달
 * @param {*} socket
 * @param {*} myMatchingInfo
 */
function emitMatchingStarted(socket, myMatchingInfo) {
  socket.emit("matching-started", formatResponse("matching-started", myMatchingInfo));
  log.emit("matching-started", socket, `my matching info: ${JSON.stringify(myMatchingInfo)}`);
}

/**
 * 해당 receiver socket에게 매칭 상대가 정해졌음을 전달
 * @param {*} socket
 * @param {*} targetMatchingInfo
 */
function emitMatchingFoundReceiver(socket, targetMatchingInfo) {
  socket.emit("matching-found-receiver", formatResponse("matching-found-receiver", targetMatchingInfo));
  log.emit("matching-found-receiver", socket, `target matching info: ${JSON.stringify(targetMatchingInfo)}`);
}

/**
 * 해당 sender socket에게 매칭 상대가 정해졌음을 전달
 * @param {*} socket
 * @param {*} targetMatchingInfo
 */
function emitMatchingFoundSender(socket, targetMatchingInfo) {
  socket.emit("matching-found-sender", formatResponse("matching-found-sender", targetMatchingInfo));
  log.emit("matching-found-sender", socket, `target matching info: ${JSON.stringify(targetMatchingInfo)}`);
}

/**
 * 해당 sender socket에게 receiver가 매칭을 수락했음을 전달
 * @param {*} socket
 */
function emitMatchingSuccessSender(socket) {
  socket.emit("matching-success-sender", formatResponse("matching-success-sender", "상대가 매칭을 수락했습니다."));
  log.emit("matching-success-sender", socket);
}

/**
 * sender, receiver socket에게 매칭 성공 및 채팅방 생성되었음을 전달
 * @param {*} socket
 */
function emitMatchingSuccess(senderSocket, receiverSocket, chatroomUuid) {
  senderSocket.emit("matching-success", formatResponse("matching-success", { chatroomUuid: chatroomUuid }));
  receiverSocket.emit("matching-success", formatResponse("matching-success", { chatroomUuid: chatroomUuid }));
  log.emit("matching-success", senderSocket, `chatroomUuid: ${chatroomUuid}`);
  log.emit("matching-success", receiverSocket, `chatroomUuid: ${chatroomUuid}`);
}

/**
 * 매칭 실패 전달
 * @param {*} socket 
 */
function emitMatchingFail(socket) {
  const myMatchingInfo = socket.myMatchingInfo;
  socket.emit("matching-fail", formatResponse("matching-fail", { myMatchingInfo }));
  log.emit("matching-fail", socket, `my matching info: ${JSON.stringify(myMatchingInfo)}`);
}

module.exports = {
  emitMatchingStarted,
  emitMatchingFoundReceiver,
  emitMatchingFoundSender,
  emitMatchingSuccessSender,
  emitMatchingSuccess,
  emitMatchingFail,
};
