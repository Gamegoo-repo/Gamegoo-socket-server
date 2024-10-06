const formatResponse = require("../common/responseFormatter");
const logger = require("../../common/winston");

/**
 * 해당 socket의 매칭 요청이 정상 접수되었음을 전달
 * @param {*} socket
 * @param {*} myMatchingInfo
 */
function emitMatchingStarted(socket, myMatchingInfo) {
  socket.emit("matching-started", formatResponse("matching-started", myMatchingInfo));
  logger.info("Emitted 'matching-started' event", `to socketId:${socket.id}, myMatchingInfo:${JSON.stringify(myMatchingInfo, null, 2)} `);
}

/**
 * 해당 receiver socket에게 매칭 상대가 정해졌음을 전달
 * @param {*} socket
 * @param {*} targetMatchingInfo
 */
function emitMatchingFoundReceiver(socket, targetMatchingInfo) {
  socket.emit("matching-found-receiver", formatResponse("matching-found-receiver", targetMatchingInfo));
  logger.info("Emitted 'matching-found-receiver' event", `to receiverSocketId:${socket.id}, targetMatchingInfo:${JSON.stringify(targetMatchingInfo, null, 2)}`);
}

/**
 * 해당 sender socket에게 매칭 상대가 정해졌음을 전달
 * @param {*} socket
 * @param {*} targetMatchingInfo
 */
function emitMatchingFoundSender(socket, targetMatchingInfo) {
  socket.emit("matching-found-sender", formatResponse("matching-found-sender", targetMatchingInfo));
  logger.info("Emitted 'matching-found-sender' event", `to senderSocketId:${socket.id}, targetMatchingInfo:${JSON.stringify(targetMatchingInfo, null, 2)}`);
}

/**
 * 해당 sender socket에게 receiver가 매칭을 수락했음을 전달
 * @param {*} socket
 */
function emitMatchingSuccessSender(socket) {
  socket.emit("matching-success-sender", formatResponse("matching-success-sender", "상대가 매칭을 수락했습니다."));
  logger.info("Emitted 'matching-success-sender' event", `to senderSocketId:${socket.id}`);
}

/**
 * sender, receiver socket에게 매칭 성공 및 채팅방 생성되었음을 전달
 * @param {*} socket
 */
function emitMatchingSuccess(senderSocket, receiverSocket, chatroomUuid) {
  senderSocket.emit("matching-success", formatResponse("matching-success", { chatroomUuid: chatroomUuid }));
  receiverSocket.emit("matching-success", formatResponse("matching-success", { chatroomUuid: chatroomUuid }));
  logger.info("Emitted 'matching-success' event", `to senderSocketId:${senderSocket.id}, chatroomUuid:${chatroomUuid}`);
  logger.info("Emitted 'matching-success' event", `to receiverSocketId:${receiverSocket.id}, chatroomUuid:${chatroomUuid}`);
}

function emitMatchingFail(socket) {
  const myMatchingInfo = socket.myMatchingInfo;
  socket.emit("matching-fail", formatResponse("matching-fail", { myMatchingInfo }));
  logger.info("Emitted 'matching-fail' event", `to socketId:${socket.id}, mymatchingInfo:${JSON.stringify(myMatchingInfo, null, 2)}`);
}

module.exports = {
  emitMatchingStarted,
  emitMatchingFoundReceiver,
  emitMatchingFoundSender,
  emitMatchingSuccessSender,
  emitMatchingSuccess,
  emitMatchingFail,
};
