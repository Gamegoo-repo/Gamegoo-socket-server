const { successResponse, failResponse } = require("../common/responseFormatter.js");
const { logger } = require("../../common/winston.js");

function logout(io) {
  return (req, res) => {
    // "Socket-Id" 헤더에서 클라이언트 소켓 ID 추출
    const socketId = req.headers["socket-id"];
    logger.info(`[POST] /logout  |  IP: ${req.ip} | Logout Request`, { socketId: socketId });

    // Socket-Id 존재 여부 검증
    if (!socketId) {
      logger.error(`[POST] /logout  |  IP: ${req.ip} | Logout failed: Missing socket ID in headers`);
      return res.status(401).json(failResponse("SOCKET_INIT_FAILED", "header에서 socket id를 추출할 수 없습니다."));
    }

    const socket = io.sockets.sockets.get(socketId);

    if (socket) {
      // (#7-4) 소켓 연결 종료
      socket.disconnect(true);
      logger.info(`[POST] /logout  |  IP: ${req.ip} | Socket Disconnected`, { socketId: socket.id, memberId: socket.memberId });
    } else {
      logger.error(`[POST] /logout  |  IP: ${req.ip} | Logout failed: Socket not found`, { socketId: socketId });
      return res.status(404).json(failResponse("SOCKET_NOT_FOUND", "socket id에 해당하는 소켓을 찾을 수 없습니다."));
    }

    // (#7-5) return 200
    logger.info(`[POST] /logout  |  IP: ${req.ip} | Logout Success`, { socketId: socketId });

    return res.status(200).json(successResponse("로그아웃 성공"));
  };
}

module.exports = (io) => {
  return {
    logout: logout(io),
  };
};
