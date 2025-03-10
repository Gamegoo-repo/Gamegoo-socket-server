const { fetchMatchingApi } = require("../../../apis/matchApi");
const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom, findMatching } = require("./matchingManager");
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

    log.info("matching-request", socket);

    // 2) socket.id가 소켓 룸 "GAMEMODE_" + gameMode에 있는지 확인
    const usersInRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
    if (usersInRoom.has(socket.id)) {
        emitError(socket, "You are already in the matching room for this game mode.");
        return;
    }

    // 3) 게임 모드에 따라 room에 join
    joinGameModeRoom(socket, io, roomName);

    try {
        // 4) 8080서버에 우선순위 계산 API 요청
        const result = await fetchMatchingApi(socket, request);

        // 6) API 정상 응답 받음
        if (result) {
            socket.data.matching.myMatchingInfo = result.myMatchingInfo;
            socket.data.matching.matchingUuid = result.myMatchingInfo.matchingUuid;

            // 7) "matching-started"emit
            emitMatchingStarted(socket, result.myMatchingInfo);

            log.debug(`myPriorityList : ${result.myPriorityList}`, socket);

            // 8) 내 우선순위 트리 갱신
            updatePriorityTree(socket, result.myPriorityList);

            // 9) room에 있는 모든 socket의 우선순위 트리 갱신
            await updateOtherPriorityTrees(io, socket, result.otherPriorityList);
        }

        // 10) priorityTree의 maxNode가 기준 점수를 넘는지 확인
        const receiverSocket = await findMatching(socket, io, threshold);

        if (receiverSocket && receiverSocket != socket) {
            // 11) receiverSocket이 매칭 room에 존재하는지 여부 확인
            log.debug(`#11 check receiverSocket is in matching room, receiverSocket's memberId : ${receiverSocket.memberId}`, socket);
            isSocketActiveAndInRoom(receiverSocket, io, roomName);

            const matchingFoundReceiverRequest = {};

            // 원하는 값들을 각각 프로퍼티에 할당
            matchingFoundReceiverRequest.senderMatchingInfo = socket.data.matching.myMatchingInfo;
            matchingFoundReceiverRequest.receiverMatchingUuid = receiverSocket.data.matching.matchingUuid;

            // 12) "matching-found-receiver" emit
            emitMatchingFoundReceiver(receiverSocket, matchingFoundReceiverRequest);
        }

    } catch (error) {
        console.log(error);
        handleSocketError(socket, error);
    }
}

// TODO: 
/**
 * # 2-11. "mathcing-retry"
 * @param {*} socket 
 * @param {*} io 
 * @param {*} request 
 */
async function handleMatchingRetry(socket, io, request) {

}

module.exports = { handleMatchingRequest, handleMatchingRetry };