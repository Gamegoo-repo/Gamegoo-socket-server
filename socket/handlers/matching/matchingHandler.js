const JWTTokenError = require("../../../common/JWTTokenError");

const { emitError, emitJWTError } = require("../../emitters/errorEmitter");

function setupMatchListeners(socket, io) {
  // 1. 매칭이 시작되었을 때 (=사용자가 들어왔을 때)
  socket.on("matching_started",(request)=>{

  });

  // 2. 매칭 중 상대방을 찾았을 때 
  socket.on("matching_found",(request)=>{

  });

  // 3. 매칭이 성공했을 때
  socket.on("matching_success",(request)=>{

  });

  // 4. 매칭이 실패했을 때
  socket.on("matching_failed",(request)=>{

  });
}

module.exports = { setupMatchListeners };
