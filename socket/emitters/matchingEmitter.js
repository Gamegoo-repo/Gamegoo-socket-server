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

/**
 * 해당 sender socket에게 receiver가 매칭을 수락했음을 전달
 * @param {*} socket
 */
function emitMatchingSuccessSender(socket) {
  socket.emit("matching-success-sender", formatResponse("matching-success-sender", "상대가 매칭을 수락했습니다."));
}

/**
 * sender, receiver socket에게 매칭 성공 및 채팅방 생성되었음을 전달
 * @param {*} socket
 */
function emitMatchingSuccess(senderSocket, receiverSocket, chatroomUuid) {
  senderSocket.emit("matching-success", formatResponse("matching-success", { chatroomUuid: chatroomUuid }));
  receiverSocket.emit("matching-success", formatResponse("matching-success", { chatroomUuid: chatroomUuid }));
}

function emitMatchingFail(socket){
  const myMatchingInfo=socket.myMatchingInfo;
  socket.emit("matching-fail",formatResponse("matching-fail",{ myMatchingInfo }));
}


module.exports = {
  emitMatchingStarted,
  emitMatchingFoundReceiver,
  emitMatchingFoundSender,
  emitMatchingSuccessSender,
  emitMatchingSuccess,
  emitMatchingFail
};
