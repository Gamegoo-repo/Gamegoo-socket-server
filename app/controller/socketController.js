const { successResponse, failResponse } = require("../common/responseFormatter");

const { emitJoinedNewChatroom } = require("../../socket/emitters/chatEmitter.js");

/**
 * 특정 회원의 socket을 특정 chatroomUuid room에 join
 * @param {*} io
 * @returns
 */
function socketRoomJoin(io) {
  return async (req, res) => {
    // request body에서 데이터를 추출
    const { memberId, chatroomUuid } = req.body;

    // 현재 연결된 socket 중 해당 memberId를 가진 socket 객체 추출
    let socket;
    try {
      const connectedSockets = await io.fetchSockets();
      for (const connSocket of connectedSockets) {
        if (memberId == connSocket.memberId) {
          socket = connSocket;
        }
      }
    } catch (error) {
      res.status(500).json(failResponse("SOCKET501", "해당 memberId를 가진 socket 객체 추출 도중 에러가 발생했습니다."));
    }

    // memberId를 가진 socket이 존재하면, 해당 socket을 chatroom join, joined-new-chatroom event emit
    if (socket) {
      try {
        // (#10-4) socket room join
        socket.join("CHAT_" + chatroomUuid);
        console.log("memberId: ", memberId, ", JOINED TO ROOM:", "CHAT_" + chatroomUuid);

        // (#10-5) "joined-new-chatroom" event emit
        emitJoinedNewChatroom(socket);
      } catch (error) {
        res.status(500).json(failResponse("SOCKET502", "socket room join 및 event emit 실패"));
      }
      res.status(200).json(successResponse("socket room join 및 event emit 성공"));
    } else {
      res.status(200).json(successResponse("해당 memberId를 갖는 socket 객체가 존재하지 않습니다."));
    }
  };
}

module.exports = (io) => {
  return {
    socketRoomJoin: socketRoomJoin(io),
  };
};
