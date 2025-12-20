const { successResponse, failResponse } = require("../common/responseFormatter.js");
const { logger } = require("../../common/winston.js");

const { emitJoinedNewChatroom, emitMannerSystemMessage, emitNewNotificationEvent } = require("../../socket/emitters/chatEmitter.js");

/**
 * 특정 회원의 socket을 특정 chatroomUuid room에 join
 * @param {*} io
 * @returns
 */
function socketRoomJoin(io) {
  return async (req, res) => {
    logger.info(`[POST] /internal/socket/room/join  |  IP: ${req.ip} | Socket Room Join Request`);
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
      logger.error(`[POST] /internal/socket/room/join  |  IP: ${req.ip} | Socket Room Join Failed - memberId:${memberId}, chatroomUuid:${chatroomUuid}`);
      return res.status(500).json(failResponse("SOCKET501", "해당 memberId를 가진 socket 객체 추출 도중 에러가 발생했습니다."));
    }

    // memberId를 가진 socket이 존재하면, 해당 socket을 chatroom join, joined-new-chatroom event emit
    if (socket) {
      try {
        // (#10-6) socket room join
        socket.join("CHAT_" + chatroomUuid);

        // (#10-7) "joined-new-chatroom" event emit
        emitJoinedNewChatroom(socket);
      } catch (error) {
        return res.status(500).json(failResponse("SOCKET502", "socket room join 및 event emit 실패"));
      }
      // (#10-8) return 200
      logger.info(`[POST] /internal/socket/room/join  |  IP: ${req.ip} | Socket Room Join Success`);
      return res.status(200).json(successResponse("socket room join 및 event emit 성공"));
    } else {
      logger.info(`[POST] /internal/socket/room/join  |  IP: ${req.ip} | Socket Room Join Success - Socket Not Found`);
      return res.status(200).json(successResponse("해당 memberId를 갖는 socket 객체가 존재하지 않습니다."));
    }
  };
}

/**
 * 특정 memberId를 갖는 모든 socket에게 시스템 메시지 event emit
 * @param {*} io
 * @returns
 */
function emitSystemMessage(io) {
  return async (req, res) => {
    logger.info(`[POST] /internal/socket/sysmessage  |  IP: ${req.ip} | Emit System Message Request`);

    // request body에서 데이터를 추출
    const { memberId, chatroomUuid, content, timestamp } = req.body;

    // 현재 연결된 socket 중 해당 memberId를 가진 socket 객체 list 추출
    let sockets = [];
    try {
      const connectedSockets = await io.fetchSockets();
      for (const connSocket of connectedSockets) {
        if (memberId == connSocket.memberId) {
          sockets.push(connSocket);
        }
      }
    } catch (error) {
      logger.error(`[POST] /internal/socket/sysmessage  |  IP: ${req.ip} | Emit System Message Failed - memberId:${memberId}, SOCKET501`);
      return res.status(500).json(failResponse("SOCKET501", "해당 memberId를 가진 socket 객체 추출 도중 에러가 발생했습니다."));
    }
    // memberId를 가진 socket이 존재하면, 해당 socket 모두에게 manner-system-message event emit
    if (sockets.length) {
      for (const connSocket of sockets) {
        try {
          emitMannerSystemMessage(connSocket, chatroomUuid, content, timestamp);
        } catch (error) {
          logger.error(`[POST] /internal/socket/sysmessage  |  IP: ${req.ip} | Emit System Message Failed - memberId:${memberId}, SOCKET503`);
          return res.status(500).json(failResponse("SOCKET503", "memberId에 해당하는 socket이 존재하지만 system message emit에 실패했습니다."));
        }
        logger.info(`[POST] /internal/socket/sysmessage  |  IP: ${req.ip} | Emit System Message Success`);
        return res.status(200).json(successResponse("시스템 메시지 emit 성공"));
      }
    } else {
      logger.info(`[POST] /internal/socket/sysmessage  |  IP: ${req.ip} | Emit System Message Success - Socket Not Found`);
      return res.status(200).json(successResponse("해당 memberId를 갖는 socket 객체가 존재하지 않습니다."));
    }
  };
}

/**
 * 특정 memberId를 갖는 모든 socket에게 new-notification event emit
 * @param {*} io
 * @returns
 */
function emitNewNotification(io) {
  return async (req, res) => {
    const memberId = Number(req.params.memberId);

    logger.info(`[POST] /internal/socket/newnotification/${memberId}  |  IP: ${req.ip} | Emit NewNotification Request`);

    // 현재 연결된 socket 중 해당 memberId를 가진 socket 객체 list 추출
    let sockets = [];
    try {
      const connectedSockets = await io.fetchSockets();
      for (const connSocket of connectedSockets) {
        if (memberId == connSocket.memberId) {
          sockets.push(connSocket);
        }
      }
    } catch (error) {
      logger.error(`[POST] /internal/socket/newnotification/${memberId}  |  IP: ${req.ip} | Emit NewNotification Failed - memberId:${memberId}, SOCKET501`);
      return res.status(500).json(failResponse("SOCKET501", "해당 memberId를 가진 socket 객체 추출 도중 에러가 발생했습니다."));
    }
    // memberId를 가진 socket이 존재하면, 해당 socket 모두에게 new-notification event emit
    if (sockets.length) {
      for (const connSocket of sockets) {
        try {
          emitNewNotificationEvent(connSocket);
        } catch (error) {
          logger.error(`[POST] /internal/socket/newnotification/${memberId}  |  IP: ${req.ip} | Emit NewNotification Failed - memberId:${memberId}, SOCKET503`);
          return res.status(500).json(failResponse("SOCKET503", "memberId에 해당하는 socket이 존재하지만 new-notification emit에 실패했습니다."));
        }
        logger.info(`[POST] /internal/socket/newnotification/${memberId}  |  IP: ${req.ip} | Emit NewNotification Success`);
        return res.status(200).json(successResponse("시스템 메시지 emit 성공"));
      }
    } else {
      logger.info(`[POST] /internal/socket/newnotification/${memberId}  |  IP: ${req.ip} | Emit NewNotification Success - Socket Not Found`);
      return res.status(200).json(successResponse("해당 memberId를 갖는 socket 객체가 존재하지 않습니다."));
    }
  };
}

module.exports = (io) => {
  return {
    socketRoomJoin: socketRoomJoin(io),
    emitSystemMessage: emitSystemMessage(io),
    emitNewNotification: emitNewNotification(io),
  };
};
