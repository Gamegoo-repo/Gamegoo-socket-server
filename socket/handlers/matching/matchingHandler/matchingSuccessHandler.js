const { matchingFoundApi, matchingSuccessApi } = require("../../../apis/matchApi");
const { getSocketIdByMatchingUuid } = require("../../../common/memberSocketMapper");
const { handleSocketError, deleteMySocketFromMatching } = require("./matchingManager");
const log = require("../../../../common/customLogger");

const {
    emitMatchingFoundSender,
    emitMatchingSuccessSender,
    emitMatchingSuccess,
} = require("../../../emitters/matchingEmitter");


/**
 * # 1-13. "matching-found-receiver"
 * @param {*} socket 
 * @param {*} io 
 * @param {*} request 
 * @returns 
 */
async function handleMatchingFoundSuccess(socket, io, request) {
    log.info(`matching found success`, socket);

    const matchingUuid = socket.data.matching.matchingUuid;
    const senderMatchingUuid = request.senderMatchingUuid;
    const senderSocket = await getSocketIdByMatchingUuid(io, senderMatchingUuid);

    console.log("matching found success");
    console.log(matchingUuid);
    console.log(senderMatchingUuid);
    console.log('sender : ', senderSocket.memberId);
    console.log('receiver : ', socket.memberId);

    if (!senderSocket) {
        log.error(`Sender socket not found for senderMatchingUuid:${request.senderMatchingUuid}`, socket);
        return;
    }

    // 15. 두 소켓의 matchingTargetUuid 값 저장
    socket.data.matching.matchingTargetUuid = senderMatchingUuid;
    senderSocket.data.matching.matchingTargetUuid = matchingUuid;

    // 16 ~ 18 데이터 삭제
    const roomName = "GAMEMODE_" + socket.data.matching.gameMode;
    deleteMySocketFromMatching(socket, io, roomName);
    deleteMySocketFromMatching(senderSocket, io, roomName);

    try {
        const result = await matchingFoundApi(socket, matchingUuid, senderMatchingUuid);
        if (result) {
            emitMatchingFoundSender(senderSocket, result.myMatchingInfo);
        }
    } catch (error) {
        log.error(`matching-found-success : ${error.message}`, socket);
        handleSocketError(socket, error);
    }
}

/**
 * # 1-25. "matching-success-receiver"
 * @param {*} socket 
 * @param {*} io 
 * @param {*} request 
 */
async function handleMatchingSuccessReceiver(io, request) {
    console.log(request);
    const senderSocket = await getSocketIdByMatchingUuid(io, request.senderMatchingUuid);
    // 26. "matching-success-sender" emit
    emitMatchingSuccessSender(senderSocket);
}

/**
 * # 1-27. "matching-success-final"
 * @param {*} socket 
 * @param {*} io 
 * @returns 
 */
async function handleMatchingSuccessFinal(socket, io) {
    log.info(`Received 'matching-success-final' from socketId:${socket.id}`, socket);

    const receiverSocket = await getSocketIdByMatchingUuid(io, socket.data.matching.matchingTargetUuid);
    if (!receiverSocket) {
        log.warn(`Receiver socket not found for matchingTargetUuid:${socket.data.matching.matchingTargetUuid}`, socket);
        return;
    }

    try {
        const result = await matchingSuccessApi(socket);
        console.log(result);
        if (result) {
            socket.join("CHAT_" + result);
            receiverSocket.join("CHAT_" + result);
            emitMatchingSuccess(socket, receiverSocket, result);
        }
    } catch (error) {
        log.error(`matching-success-final : ${error.message}`, socket);
        handleSocketError(socket, error);
    }
}



module.exports = { handleMatchingFoundSuccess, handleMatchingSuccessReceiver, handleMatchingSuccessFinal };