const JWTTokenError = require("../../../common/JWTTokenError");

const { emitError, emitJWTError } = require("../../emitters/errorEmitter");

/**
 * Matching socket event 관련 리스너
 * @param {*} socket 
 * @param {*} io 
 */
function setupMatchListeners(socket, io) {

  // 사용자가 매칭을 시작할 때 
  socket.on("matching_started", (request) => {
    const matchingType = request.matchingType;
    const gameMode = request.gameMode;
    const mike = request.mike;
    const tier = request.tier;
    const rank = request.rank;
    const manner = request.manner;
    const mainP = request.mainP;
    const subP = request.subP;
    const wantP = request.wantP;

    printMatchingInformation(matchingType,mike,tier,rank,mainP,mainP,subP,wantP,manner,gameMode)

    // 사용자 소켓을 gameMode에 해당하는 룸에 조인시킴
    socket.join("GAMEMODE_"+gameMode);

    // 룸에 있는 모든 사용자 출력
    const usersInRoom = getUsersInRoom(io, "GAMEMODE_"+gameMode);
    console.log(`Room ${gameMode} has the following users: ${usersInRoom.join(", ")}`);
    
    // 사용자 정보 로그
    console.log(`User ${socket.id} joined room: GAMEMODE_${gameMode}`);

  });

  // 2. 매칭 중 상대방을 찾았을 때 
  socket.on("matching_found",(request)=>{
    console.log(request);
  });

  // 3. 매칭이 성공했을 때
  socket.on("matching_success",(request)=>{
    console.log(request);
  });

  // 4. 매칭이 실패했을 때
  socket.on("matching_failed",(request)=>{
    console.log(request);
  });

  // 사용자가 접속을 끊었을 때
  socket.on("disconnect", () => {
    const room = userRooms[socket.id];
    if (room) {
      console.log(`User ${socket.id} left room: ${room}`);
      delete userRooms[socket.id]; // 사용자 정보 삭제
    }
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

/**
 * matching 디버깅용 함수
 * @param {*} matchingType 
 * @param {*} mike 
 * @param {*} tier 
 * @param {*} rank 
 * @param {*} manner 
 * @param {*} mainP 
 * @param {*} subP 
 * @param {*} wantP 
 * @param {*} manner 
 * @param {*} gameMode 
 */
function printMatchingInformation(matchingType, mike, tier, rank, manner, mainP, subP, wantP,manner,gameMode){
  console.log('========== Received Matching Information ==========');
  console.log('Matching Type: ' + matchingType);
  console.log('Game Mode: ' + gameMode);
  console.log('Mike: ' + mike);
  console.log('Tier: ' + tier);
  console.log('Rank: ' + rank);
  console.log('Manner: ' + manner);
  console.log('Main P: ' + mainP);
  console.log('Sub P: ' + subP);
  console.log('Want P: ' + wantP);
  console.log('manner: ' + manner);
  console.log('gameMode: ' + gameMode);
  console.log('==========================================');
}

module.exports = { setupMatchListeners };
