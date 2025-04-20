const { fetchMatchingApi } = require("../../../apis/matchApi");
const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom, findMatching, getUserCountsInMatchingRoom } = require("./matchingManager");
const { isSocketActiveAndInRoom } = require("./matchingCommonHandler");
const { emitError } = require("../../../emitters/errorEmitter");
const log = require("../../../../common/customLogger");

const {
    emitMatchingStarted,
    emitMatchingFoundReceiver
} = require("../../../emitters/matchingEmitter");

/**
 * # 1-1. "matching-request" 
 * @param {*} socket 
 * @param {*} io 
 * @param {*} request 
 * @returns 
 */
async function handleMatchingRequest(socket, io, request) {
    const threshold = request.threshold;
    const gameMode = request.gameMode;
    socket.data.matching.gameMode = gameMode;
    const roomName = "GAMEMODE_" + gameMode;
    socket.data.matching.roomName = roomName;

    // 2) socket.id가 소켓 룸 "GAMEMODE_" + gameMode에 있는지 확인
    const usersInRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
    if (usersInRoom.has(socket.id)) {
        log.warn("# 2) Socket already in matching room", socket);
        emitError(socket, "You are already in the matching room for this game mode.");
        return;
    }

    // 3) 게임 모드에 따라 room에 join
    joinGameModeRoom(socket, io, roomName);
    log.info(`# 3) Joined game mode room: ${roomName}`, socket);

    try {
        // 4) 8080서버에 우선순위 계산 API 요청 전 로그
        const result = await fetchMatchingApi(socket, request);

        // 6) API 정상 응답 받음
        if (result) {
            socket.data.matching.myMatchingInfo = result.myMatchingInfo;
            socket.data.matching.matchingUuid = result.myMatchingInfo.matchingUuid;
            log.debug(`#6) Matching Info set with UUID: ${result.myMatchingInfo.matchingUuid}`, socket);

            // 7) "matching-started" emit
            emitMatchingStarted(socket, result.myMatchingInfo);

            // matching-count emit
            getUserCountsInMatchingRoom(socket, io, roomName);

            log.info(`# 8) myPriorityList : ${JSON.stringify(result.myPriorityList)}`, socket);

            // 8) 내 우선순위 트리 갱신
            updatePriorityTree(socket, result.myPriorityList);

            // 9) room에 있는 모든 socket의 우선순위 트리 갱신
            await updateOtherPriorityTrees(io, socket, result.otherPriorityList);
            log.info("# 9) Updated other sockets' priority trees", socket);
        }

        // 10) priorityTree의 maxNode가 기준 점수를 넘는지 확인
        log.info("# 10 Finding matching receiver", socket);
        const receiverSocket = await findMatching(socket, io, threshold);

        if (receiverSocket && receiverSocket !== socket) {
            // 11) receiverSocket이 매칭 room에 존재하는지 여부 확인
            log.debug(`#11 receiverSocket memberId: ${receiverSocket.memberId} is in matching room`, socket);
            isSocketActiveAndInRoom(receiverSocket, io, roomName);

            const matchingFoundReceiverRequest = {};
            matchingFoundReceiverRequest.senderMatchingInfo = socket.data.matching.myMatchingInfo;
            matchingFoundReceiverRequest.receiverMatchingUuid = receiverSocket.data.matching.matchingUuid;

            // 12) "matching-found-receiver" emit
            emitMatchingFoundReceiver(receiverSocket, matchingFoundReceiverRequest);
        } else {
            log.warn("# 10) No matching receiver found or self-matching detected", socket);
        }

    } catch (error) {
        log.error(`#4) Error in handleMatchingRequest: ${error.message}`, socket);
        handleSocketError(socket, error);
    }
}

/**
 * # 2-11. "matching-retry"
 * @param {*} socket 
 * @param {*} io 
 * @param {*} request 
 */
async function handleMatchingRetry(socket, io, request) {
    // 12) priorityTree의 maxNode가 기준 점수를 넘는지 확인
    log.info("# 10 Finding matching receiver", socket);

    // socket 유효성 확인
    if ( !socket.data || !socket.data.matching) {
        log.warn("# 10) Invalid socket context in handleMatchingRetry", socket);
        return;
    }

    let receiverSocket;
    try {
        receiverSocket = await findMatching(socket, io, request.threshold);
    } catch (e) {
        log.error("# 10) Error in findMatching", socket, e);
        return;
    }
    if (receiverSocket && receiverSocket !== socket) {
        // 13) receiverSocket이 매칭 room에 존재하는지 여부 확인
        log.debug(`#11 receiverSocket memberId: ${receiverSocket.memberId} is in matching room`, socket);
        isSocketActiveAndInRoom(receiverSocket, io, socket.data.matching.roomName);

        const matchingFoundReceiverRequest = {};
        matchingFoundReceiverRequest.senderMatchingInfo = socket.data.matching.myMatchingInfo;
        matchingFoundReceiverRequest.receiverMatchingUuid = receiverSocket.data.matching.matchingUuid;

        // 14) "matching-found-receiver" emit
        emitMatchingFoundReceiver(receiverSocket, matchingFoundReceiverRequest);
    } else {
        log.warn("# 10) No matching receiver found or self-matching detected", socket);
    }

}

module.exports = { handleMatchingRequest, handleMatchingRetry };
