const { updateMatchingStatusApi, updateBothMatchingStatusApi } = require("../../../apis/matchApi");
const { getSocketIdByMatchingUuid } = require("../../../common/memberSocketMapper");
const { handleSocketError } = require("./matchingManager");
const { deleteMySocketFromMatching } = require("./matchingManager");
const log = require("../../../../common/customLogger");

const {
  emitMatchingFail,
} = require("../../../emitters/matchingEmitter");

// TODO: 
/**
 * # 4-27, 5-25. "matching-reject"
 * @param {*} socket 
 * @param {*} io 
 */
async function handleMatchingReject(socket, io) {
    log.info(`Received 'matching-reject' from socketId:${socket.id}`);

    const otherSocket = await getSocketIdByMatchingUuid(io, socket.data.matching.matchingTargetUuid);
    if (socket.data.matching.gameMode) {
        try {
            await updateBothMatchingStatusApi(socket, "FAIL", socket.data.matching.matchingTargetUuid);
        } catch (error) {
            log.error(`matching-reject : ${error.message}`, socket);
            handleSocketError(socket, error);
        }
    }

    if (otherSocket) {
        emitMatchingFail(otherSocket);
        otherSocket.data.matching.matchingTargetUuid = null;
    }

    emitMatchingFail(socket);
    socket.data.matching.matchingTargetUuid = null;
}

// TODO: 
/**
 * # 3-13. "matching-not-found"
 * @param {*} socket 
 */
async function handleMatchingNotFound(socket) {

}

// TODO: 
/**
 * "matching-fail"
 * @param {*} socket 
 * @returns 
 */
async function handleMatchingFail(socket) {
    log.info(`matching fail`, socket);

    if (socket.data.matching.gameMode) {
        try {
            await updateMatchingStatusApi(socket, "FAIL");
        } catch (error) {
            log.error(`Error in 'matching-fail' for socketId:${socket.id}, error: ${error.message}`);
            handleSocketError(socket, error);
            return;
        }
    }

    socket.data.matching.matchingTargetUuid = null;
    emitMatchingFail(socket);
}

/**
 * "matching-quit"
 * @param {*} socket 
 * @param {*} io 
 * @returns 
 */
async function handleMatchingQuit(socket, io) {
    log.info(`matching-quit`, socket);

    if (socket.data.matching.gameMode) {
        try {
            await updateMatchingStatusApi(socket, "QUIT");
        } catch (error) {
            log.error(`matching-quit : ${error.message}`, socket);
            handleSocketError(socket, error);
            return;
        }
    }

    deleteMySocketFromMatching(socket, io, socket.data.matching.roomName);
}

module.exports = { handleMatchingReject, handleMatchingNotFound, handleMatchingFail, handleMatchingQuit };