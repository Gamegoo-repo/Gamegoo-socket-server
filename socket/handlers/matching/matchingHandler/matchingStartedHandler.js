const JWTTokenError = require("../../../../common/JWTTokenError");
const { getSocketIdByMemberId } = require("../../../common/memberSocketMapper");
const { emitError, emitJWTError } = require("../../../emitters/errorEmitter");
const { PriorityTree } = require("../../../common/PriorityTree");

/**
 * 내 우선순위 트리 갱신
 * @param {*} socket 
 * @param {*} priorityList 
 */
function updatePriorityTree(socket, priorityList) {
    if (!socket.priorityTree) {
        socket.priorityTree = new PriorityTree();
    }

    priorityList.forEach((item) => {
        socket.priorityTree.insert(item.memberId, item.priorityValue);
    });

    if (socket.priorityTree.root) {
        const maxNode = socket.priorityTree.getMax(socket.priorityTree.root);
        socket.highestPriorityMember = maxNode.memberId;
        socket.highestPriorityValue = maxNode.priorityValue;
    }

    console.log('==================================================');
    console.log(`Socket (${socket.memberId}) Priority Tree (sorted):`, JSON.stringify(socket.priorityTree.getSortedList(), null, 2));
    console.log('Highest Priority Member:', socket.highestPriorityMember);
    console.log('Highest Priority Value:', socket.highestPriorityValue);
}

/**
 * 다른 사용자의 우선순위 트리 갱신
 * @param {*} io 
 * @param {*} socket 
 * @param {*} otherPriorityList 
 */
async function updateOtherPriorityTrees(io, socket, otherPriorityList) {
    for (const item of otherPriorityList) {
        const otherSocket = await getSocketIdByMemberId(io, item.memberId);

        if (otherSocket) {
            if (!otherSocket.priorityTree) {
                otherSocket.priorityTree = new PriorityTree();
            }

            otherSocket.priorityTree.insert(socket.memberId, item.priorityValue);

            if (otherSocket.priorityTree.root) {
                const otherMaxNode = otherSocket.priorityTree.getMax(otherSocket.priorityTree.root);
                otherSocket.highestPriorityMember = otherMaxNode.memberId;
                otherSocket.highestPriorityValue = otherMaxNode.priorityValue;
            }

            console.log('==================================================');
            console.log(`Other Socket (${otherSocket.memberId}) Priority Tree (sorted):`, JSON.stringify(otherSocket.priorityTree.getSortedList(), null, 2));
            console.log('Other Socket Highest Priority Member:', otherSocket.highestPriorityMember);
            console.log('Other Socket Highest Priority Value:', otherSocket.highestPriorityValue);
        }
    }

    console.log('Other Priority Trees updated based on response.');
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
function joinGameModeRoom(socket, io, gameMode) {
    socket.join("GAMEMODE_" + gameMode);

    const usersInRoom = getUsersInRoom(io, "GAMEMODE_" + gameMode);
    console.log(`Room ${gameMode} has the following users: ${usersInRoom.join(", ")}`);
    console.log(`User ${socket.id} joined room: GAMEMODE_${gameMode}`);
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
    joinGameModeRoom
};
