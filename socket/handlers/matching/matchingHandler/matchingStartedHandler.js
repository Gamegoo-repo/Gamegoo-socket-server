const JWTTokenError = require("../../../../common/JWTTokenError");
const { getSocketIdByMemberId } = require("../../../common/memberSocketMapper");
const { emitError, emitJWTError } = require("../../../emitters/errorEmitter");
const { PriorityTree } = require("../../../common/PriorityTree");

/**
 * 내 우선순위 트리 갱신
 * @param {*} socket 
 * @param {*} priorityList 
 * @returns {boolean} 중복 여부
 */
function updatePriorityTree(socket, priorityList) {
    if (!socket.priorityTree) {
        socket.priorityTree = new PriorityTree();
    }

    // 내 소켓에 다른 사용자 우선순위 값 넣기
    for (const item of priorityList) {
        if(!socket.priorityTree.contains(item.memberId)){
            socket.priorityTree.insert(item.memberId, item.priorityValue);
        }
    }

    // 내 소켓의 우선순위 최댓값 노드 변경
    if (socket.priorityTree.root) {
        socket.highestPriorityNode = socket.priorityTree.getMax(socket.priorityTree.root);
    }

    console.log('==================================================');
    console.log(`Socket (${socket.memberId}) Priority Tree (sorted):`, JSON.stringify(socket.priorityTree.getSortedList(), null, 2));
    console.log('Highest Priority Member:', socket.highestPriorityNode.memberId);
    console.log('Highest Priority Value:', socket.highestPriorityNode.priorityValue);
}

/**
 * 다른 사용자의 우선순위 트리 갱신
 * @param {*} io 
 * @param {*} socket 
 * @param {*} otherPriorityList 
 * @returns {boolean} 중복 여부
 */
async function updateOtherPriorityTrees(io, socket, otherPriorityList) {
    for (const item of otherPriorityList) {
        const otherSocket = await getSocketIdByMemberId(io, item.memberId);

        if (otherSocket) {
            if (!otherSocket.priorityTree) {
                otherSocket.priorityTree = new PriorityTree();
            }

            // 다른 사용자 소켓에 내 우선순위 값 넣기
            if(!otherSocket.priorityTree.contains(socket.memberId)){
                otherSocket.priorityTree.insert(socket.memberId, item.priorityValue);
            }
            // 다른 사용자의 우선순위 최댓값 노드 변경
            if (otherSocket.priorityTree.root) {
                otherSocket.highestPriorityNode = otherSocket.priorityTree.getMax(otherSocket.priorityTree.root);
            }

            console.log('==================================================');
            console.log(`Other Socket (${otherSocket.memberId}) Priority Tree (sorted):`, JSON.stringify(otherSocket.priorityTree.getSortedList(), null, 2));
            console.log('Other Socket Highest Priority Member:', otherSocket.highestPriorityNode.memberId);
            console.log('Other Socket Highest Priority Value:', otherSocket.highestPriorityNode.priorityValue);
        }
    }

    console.log('Other Priority Trees updated based on response.');
}

/**
 * 매칭 상대 찾기
 * @param {*} socket 
 * @param {*} io 
 * @param {*} value 
 * @returns 
 */
async function findMatching(socket, io, value) {
    if (socket.highestPriorityNode !== null) {
        // 우선순위 값 55를 넘는 모든 소켓 확인하기
        while (socket.highestPriorityNode.priorityValue >= value) {
            const otherSocket = await getSocketIdByMemberId(io, socket.highestPriorityNode.memberId);
            if (otherSocket && otherSocket.highestPriorityNode.priorityValue >= value) {
                console.log("MATCHING FOUND");
                socket.emit("matching_found", {
                    myMemberId: socket.memberId,
                    otherMemberId: socket.highestPriorityNode.memberId
                });
                return;
            } else {
                // 최댓값을 가지는 노드의 전 노드 확인
                socket.highestPriorityNode = socket.priorityTree.getMaxBeforeNode(socket.priorityTree.root, socket.highestPriorityNode);
            }
        }
    }
}

/**
 * 에러 처리
 * @param {*} socket 
 * @param {*} error 
 */
function handleSocketError(socket, error) {
    if (error instanceof JWTTokenError) {
        console.error("JWT Token Error:", error.message);
        emitJWTError(socket, error.code, error.message);
    } else {
        console.error("Error POST matching started:", error);
        emitError(socket, error.message);
    }
}

/**
 * 매칭 룸 입장
 * @param {*} socket 
 * @param {*} io 
 * @param {*} gameMode 
 */
function joinGameModeRoom(socket, io, roomName) {
    socket.join(roomName);

    const usersInRoom = getUsersInRoom(io, roomName);
    console.log(`Room ${roomName} has the following users: ${usersInRoom.join(", ")}`);
    console.log(`User ${socket.id} joined room: ${roomName}`);
}

/**
 * 특정 룸에 있는 사용자 모두 조회
 * @param {*} io 
 * @param {*} room 
 * @returns {Array} usersInRoom
 */
function getUsersInRoom(io, room) {
    const clients = io.sockets.adapter.rooms.get(room) || new Set();
    return Array.from(clients);
}

module.exports = {
    updatePriorityTree,
    updateOtherPriorityTrees,
    handleSocketError,
    joinGameModeRoom,
    findMatching
};
