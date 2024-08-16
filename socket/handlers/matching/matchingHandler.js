const JWTTokenError = require("../../../common/JWTTokenError");
const { getSocketIdByMemberId } = require("../../common/memberSocketMapper");
const { fetchMatching } = require("../../apis/matchApi");
const { emitError, emitJWTError } = require("../../emitters/errorEmitter");
const { PriorityTree } = require("../../common/PriorityTree");  // 올바르게 가져오기

/**
 * Matching socket event 관련 리스너
 * @param {*} socket 
 * @param {*} io 
 */
async function setupMatchListeners(socket, io) {

  // 사용자가 매칭을 시작할 때 
  socket.on("matching_started", async (request) => {
    const gameMode = request.gameMode;

    try {
      // 우선순위 API 불러오기
      const result = await fetchMatching(socket, request);

      const myPriorityList = result.myPriorityList;
      const otherPriorityList = result.otherPriorityList;

      /* 
        현재 들어온 사용자의 priorityTree 계산
      */
      myPriorityList.forEach((item) => {
        socket.priorityTree.insert(item.memberId, item.priorityValue);
      });

      // 가장 큰 priority 값을 socket 객체에 저장 (루트 노드가 항상 최대값을 가짐)
      const maxNode = socket.priorityTree.getMax();

      // maxNode가 null인지 확인
      if (maxNode) {
        socket.highestPriorityMember = maxNode.memberId;
        socket.highestPriorityValue = maxNode.priorityValue;
      } else {
        socket.highestPriorityMember = null;
        socket.highestPriorityValue = null;
      }

      // socket.priorityTree를 출력
      console.log('==================================================');
      console.log(`My Socket (${socket.memberId}) Priority Tree (sorted):`, JSON.stringify(socket.priorityTree.getSortedList(), null, 2));
      console.log('Highest Priority Member:', socket.highestPriorityMember);
      console.log('Highest Priority Value:', socket.highestPriorityValue);

      /* 
        원래 있던 사용자의 priorityTree 계산
      */
      for (const item of otherPriorityList) {
        const otherSocket = await getSocketIdByMemberId(io, item.memberId); // getSocketIdByMemberId 함수 사용

        if (otherSocket) {
          // otherSocket의 priorityTree가 초기화되지 않은 경우 초기화
          if (!otherSocket.priorityTree) {
            otherSocket.priorityTree = new PriorityTree();
          }

          // 현재 소켓의 ID와 우선순위 값을 otherSocket의 priorityTree에 추가
          otherSocket.priorityTree.insert(socket.memberId, item.priorityValue);

          // 가장 큰 priority 값을 otherSocket 객체에 저장
          const otherMaxNode = otherSocket.priorityTree.getMax();
          
          // otherMaxNode가 null인지 확인
          if (otherMaxNode) {
            otherSocket.highestPriorityMember = otherMaxNode.memberId;
            otherSocket.highestPriorityValue = otherMaxNode.priorityValue;
          } else {
            otherSocket.highestPriorityMember = null;
            otherSocket.highestPriorityValue = null;
          }

          // otherSocket의 priorityTree를 출력
          console.log('==================================================');
          console.log(`Other Socket (${otherSocket.memberId}) Priority Tree (sorted):`, JSON.stringify(otherSocket.priorityTree.getSortedList(), null, 2));
          console.log('Other Socket Highest Priority Member:', otherSocket.highestPriorityMember);
          console.log('Other Socket Highest Priority Value:', otherSocket.highestPriorityValue);
        }
      }

      console.log('Other Priority Trees updated based on response.');
    } catch (error) {
      if (error instanceof JWTTokenError) {
        console.error("JWT Token Error:", error.message);
        emitJWTError(socket, error.code, error.message);
      } else {
        console.error("Error POST matching started:", error);
        emitError(socket, error.message);
      }
    }

    // 사용자 소켓을 gameMode에 해당하는 룸에 조인시킴
    socket.join("GAMEMODE_" + gameMode);

    // 룸에 있는 모든 사용자 출력
    const usersInRoom = getUsersInRoom(io, "GAMEMODE_" + gameMode);
    console.log(`Room ${gameMode} has the following users: ${usersInRoom.join(", ")}`);

    // 사용자 정보 로그
    console.log(`User ${socket.id} joined room: GAMEMODE_${gameMode}`);
  });

  // 2. 매칭 중 상대방을 찾았을 때 
  socket.on("matching_found", (request) => {
    console.log(request);
  });

  // 3. 매칭이 성공했을 때
  socket.on("matching_success", (request) => {
    console.log(request);
  });

  // 4. 매칭이 실패했을 때
  socket.on("matching_failed", (request) => {
    console.log(request);
  });
}


/**
 * 특정 룸에 있는 사용자를 모두 가져오는 함수
 * @param {*} io 
 * @param {*} room 
 * @returns {Array} usersInRoom
 */
function getUsersInRoom(io, room) {
  const clients = io.sockets.adapter.rooms.get(room) || new Set();
  return Array.from(clients);
}


module.exports = { setupMatchListeners };
