const JWTTokenError = require("../../../common/JWTTokenError");

const { emitError, emitJWTError } = require("../../emitters/errorEmitter");

function setupMatchListeners(socket, io) {
  // 1. 매칭이 시작되었을 때 (=사용자가 들어왔을 때)
  socket.on("matching_started",(request)=>{
    const matchingType = request.matchingType;
    const gameMode = request.gameMode;
    const mike = request.mike;
    const tier = request.tier;
    const rank = request.rank;
    const manner = request.manner;
    const mainP = request.mainP;
    const subP = request.subP;
    const wantP = request.wantP;

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
    console.log('==========================================');
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
}

module.exports = { setupMatchListeners };
