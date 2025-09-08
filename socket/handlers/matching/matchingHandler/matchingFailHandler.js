const { updateMatchingStatusApi } = require("../../../apis/matchApi");
const { getSocketIdByMatchingUuid } = require("../../../common/memberSocketMapper");
const { handleSocketError } = require("./matchingManager");
const { deleteMySocketFromMatching, getUserCountsInMatchingRoom, resetMatchingObject } = require("./matchingManager");
const log = require("../../../../common/customLogger");

const {
    emitMatchingFail,
} = require("../../../emitters/matchingEmitter");


/**
 * # 4-27, 5-25. "matching-reject"
 * @param {*} socket 
 * @param {*} io 
 */
async function handleMatchingReject(socket, io) {
    // matching target socket
    const otherSocket = await getSocketIdByMatchingUuid(io, socket.data.matching.matchingTargetUuid);

    // 28. 매칭 status 변경
    if (socket.data.matching.gameMode) {
        try {
            await updateMatchingStatusApi(socket, "FAIL");
        } catch (error) {
            log.error(`matching-reject : ${error.message}`, socket);
            handleSocketError(socket, error);
        }
    }

    // 30. "matching-fail" emit
    if (otherSocket) {
        emitMatchingFail(otherSocket);
    }

    // 31. matching 관련 데이터 전부 초기화
    resetMatchingObject(socket);
}

/**
 * "matching-not-found"
 * @param {*} socket 
 */
async function handleMatchingNotFound(socket, io) {
    log.debug(`matching-not-found`, socket);

    if (socket.data.matching.gameMode) {
        try {
            await updateMatchingStatusApi(socket, "FAIL");
        } catch (error) {
            log.error(`matching-not-found : ${error.message}`, socket);
            handleSocketError(socket, error);
            return;
        }
    }
    const roomName=socket.data.matching.roomName;
    deleteMySocketFromMatching(socket, io,roomName);   
    getUserCountsInMatchingRoom(socket,io,roomName);
}

/**
 * "matching-fail"
 * @param {*} socket 
 * @returns 
 */
async function handleMatchingFail(socket) {
    // 매칭 status 변경
    if (socket.data.matching.gameMode) {
        try {
            await updateMatchingStatusApi(socket, "FAIL");
        } catch (error) {
            log.error(`Error in 'matching-fail' for socketId:${socket.id}, error: ${error.message}`);
            handleSocketError(socket, error);
            return;
        }
    }

    // 매칭 관련 데이터 초기화
    resetMatchingObject(socket);
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

    // 상태 소켓이 있으면 matchingFail 시키도록
    if(socket.data.matching.matchingTargetUuid!=null){
        const otherSocket = await getSocketIdByMatchingUuid(io, socket.data.matching.matchingTargetUuid);

        if (otherSocket) {
            emitMatchingFail(otherSocket);
        }       
    }

    const roomName=socket.data.matching.roomName;
    deleteMySocketFromMatching(socket, io,roomName);
    getUserCountsInMatchingRoom(socket,io,roomName);
    resetMatchingObject(socket);
}

module.exports = { handleMatchingReject, handleMatchingNotFound, handleMatchingFail, handleMatchingQuit };