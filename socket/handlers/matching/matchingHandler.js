const JWTTokenError = require("../../../common/JWTTokenError");
const { getSocketIdByMemberId } = require("../../common/memberSocketMapper");
const { fetchMatching } = require("../../apis/matchApi");
const { emitError, emitJWTError } = require("../../emitters/errorEmitter");

/**
 * Matching socket event 관련 리스너
 * @param {*} socket 
 * @param {*} io 
 */
function setupMatchListeners(socket, io) {

  // 사용자가 매칭을 시작할 때 
  socket.on("matching_started", (request) => {
    const gameMode = request.gameMode;

    // 우선순위 API 불러오기
    fetchMatching(socket, request)
      .then((result) => {
        const myPriorityList = result.myPriorityList;
        const otherPriorityList = result.otherPriorityList;

        // 가장 큰 우선순위 값, memberId 구하기
        let highestPriorityValue = -999;
        let highestPriorityMember = null;

        /* 
          현재 들어온 사용자의 priorityTable 계산
         */
        myPriorityList.forEach((item) => {
          socket.priorityTable[item.memberId] = item.priorityValue;

          // 가장 큰 priority 값을 가진 memberId와 값을 저장
          if (item.priorityValue > highestPriorityValue) {
            highestPriorityValue = item.priorityValue;
            highestPriorityMember = item.memberId;
          }
        });

        // 가장 큰 priority 값을 socket 객체에 저장
        socket.highestPriorityMember = highestPriorityMember;
        socket.highestPriorityValue = highestPriorityValue;

        // socket.priorityTable을 출력
        console.log('==================================================');
        console.log('My Priority Table:', JSON.stringify(socket.priorityTable, null, 2));
        console.log('Highest Priority Member:', socket.highestPriorityMember);
        console.log('Highest Priority Value:', socket.highestPriorityValue);

        // otherPriorityList를 위한 초기화
        highestPriorityValue = -999;
        highestPriorityMember = null;

        /* 
          원래 있던 사용자의 priorityTable 계산
         */
        //TODO: otherSocket.priorityTable이 계산될 때마다 초기화되는 문제 발견
        otherPriorityList.forEach((item) => {
          const otherSocket = getSocketIdByMemberId(io, item.memberId);

          if (otherSocket) {
            // otherSocket의 priorityTable이 초기화되지 않은 경우 초기화
            if (!otherSocket.priorityTable) {
              otherSocket.priorityTable = {};
            }

            // 현재 소켓의 ID와 우선순위 값을 otherSocket의 priorityTable에 추가
            otherSocket.priorityTable[socket.memberId] = item.priorityValue;

            // 다른 소켓에서도 가장 큰 priority 값을 업데이트
            if (item.priorityValue > (otherSocket.highestPriorityValue || -999)) {
              otherSocket.highestPriorityMember = socket.memberId;
              otherSocket.highestPriorityValue = item.priorityValue;
            }

            // otherSocket의 priorityTable을 출력
            console.log('==================================================');
            console.log(`Other Socket (${otherSocket.memberId}) Priority Table:`, JSON.stringify(otherSocket.priorityTable, null, 2));
            console.log('Other Socket Highest Priority Member:', otherSocket.highestPriorityMember);
            console.log('Other Socket Highest Priority Value:', otherSocket.highestPriorityValue);

          }
        });

        console.log('Other Priority Tables updated based on response.');

      })
      .catch((error) => {
        if (error instanceof JWTTokenError) {
          console.error("JWT Token Error:", error.message);
          emitJWTError(socket, error.code, error.message);
        } else {
          console.error("Error POST matching started:", error);
          emitError(socket, error.message);
        }
      });

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
