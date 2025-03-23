const { matchingFoundApi, matchingSuccessApi } = require("../../../apis/matchApi");
const { getSocketIdByMatchingUuid } = require("../../../common/memberSocketMapper");
const { handleSocketError, deleteMySocketFromMatching } = require("./matchingManager");
const log = require("../../../../common/customLogger");

const {
    emitMatchingFoundSender,
    emitMatchingSuccessSender,
    emitMatchingSuccess,
    emitMatchingFail,
} = require("../../../emitters/matchingEmitter");

/**
 * # 1-13. "matching-found-receiver"
 * @param {*} socket 
 * @param {*} io 
 * @param {*} request 
 * @returns 
 */
async function handleMatchingFoundSuccess(socket, io, request) {
    const matchingUuid = socket.data.matching.matchingUuid;
    const senderMatchingUuid = request.senderMatchingUuid;
    const senderSocket = await getSocketIdByMatchingUuid(io, senderMatchingUuid);

    log.debug(`Matching Uuid: ${matchingUuid}, Sender Matching Uuid: ${senderMatchingUuid}`, socket);
    if (senderSocket) {
        log.debug(`# 13) Found sender socket with memberId: ${senderSocket.memberId}`, socket);
        log.debug(`# 13) Receiver memberId: ${socket.memberId}`, socket);
    } else {
        log.error(`# 13) Sender socket not found for senderMatchingUuid: ${senderMatchingUuid}`, socket);
        return;
    }

    // 15) 두 소켓의 matchingTargetUuid 값 저장
    socket.data.matching.matchingTargetUuid = senderMatchingUuid;
    senderSocket.data.matching.matchingTargetUuid = matchingUuid;
    log.info(`# 15) Set matchingTargetUuid - Sender: ${senderMatchingUuid}, Receiver: ${matchingUuid}`, socket);

    // 16 ~ 18 데이터 삭제
    const roomName = "GAMEMODE_" + socket.data.matching.gameMode;
    deleteMySocketFromMatching(socket, io, roomName);
    deleteMySocketFromMatching(senderSocket, io, roomName);
    log.info(`# 16~18) Deleted sockets from matching room: ${roomName}`, socket);

    try {
        const result = await matchingFoundApi(socket, matchingUuid, senderMatchingUuid);
        if (result) {
            emitMatchingFoundSender(senderSocket, result.myMatchingInfo);
        }
    } catch (error) {
        log.error(`13) matching-found-success error: ${error.message}`, socket);
        handleSocketError(socket, error);
    }
}

/**
 * # 1-25. "matching-success-receiver"
 * @param {*} io 
 * @param {*} request 
 */
async function handleMatchingSuccessReceiver(socket,io, request) {
    const senderSocket = await getSocketIdByMatchingUuid(io, request.senderMatchingUuid);
    
    // 상대방이 있을 경우
    if(senderSocket){
        emitMatchingSuccessSender(senderSocket);
    } else{ //상대방이 나갔을 경우
        emitMatchingFail(socket);
    }
}

/**
 * # 1-27. "matching-success-final"
 * @param {*} socket 
 * @param {*} io 
 * @returns 
 */
async function handleMatchingSuccessFinal(socket, io) {
    const receiverSocket = await getSocketIdByMatchingUuid(io, socket.data.matching.matchingTargetUuid);
    if (!receiverSocket) {
        log.warn(`# 27) Receiver socket not found for matchingTargetUuid: ${socket.data.matching.matchingTargetUuid}`, socket);
        return;
    }

    try {
        const result = await matchingSuccessApi(socket);
        if (result) {
            socket.join("CHAT_" + result);
            receiverSocket.join("CHAT_" + result);
            log.info(`# 27) ${socket.data.matching.matchingTargetUuid}, ${socket.data.matching.matchingUuid} joined chat room: CHAT_${result}`, socket);
            emitMatchingSuccess(socket, receiverSocket, result);
        }
    } catch (error) {
        log.error(`#27) matching-success-final error: ${error.message}`, socket);
        handleSocketError(socket, error);
    }
}

module.exports = { handleMatchingFoundSuccess, handleMatchingSuccessReceiver, handleMatchingSuccessFinal };
