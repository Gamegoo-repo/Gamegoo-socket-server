const { successResponse, failResponse } = require("../common/responseFormatter.js");
const { logger } = require("../../common/winston.js");

const { emitFriendOnline } = require("../../socket/emitters/friendEmitter.js");
const { getSocketIdsByMemberIds } = require("../../socket/common/memberSocketMapper.js");

function emitFriendOnlineEvent(io) {
  return async (req, res) => {
    const memberId = Number(req.params.memberId);
    const { targetMemberId } = req.body;

    logger.info(`[POST] /internal/socket/friend/online/${memberId}  |  IP: ${req.ip} | Friend Online Event Emit Request`);

    // 현재 연결된 socket 중 해당 targetMemberId를 가진 socket 객체 list 추출
    let targetMemberSockets = [];
    try {
      targetMemberSockets = await getSocketIdsByMemberIds(io, [targetMemberId]);
    } catch (error) {
      logger.error(
        `[POST] /internal/socket/friend/online/${memberId}  |  IP: ${req.ip} | Friend Online Event Emit Request Failed - targetMemberId:${targetMemberId}, SOCKET501`
      );
      res.status(500).json(failResponse("SOCKET501", "해당 targetMemberId를 가진 socket 객체 추출 도중 에러가 발생했습니다."));
    }

    // targetMemberId를 가진 socket이 없으면 event emit하지 않고 종료
    if (!targetMemberSockets.length) {
      logger.info(`[POST] /internal/socket/friend/online/${memberId}  |  IP: ${req.ip} | Friend Online Event Emit Request Success - Socket Not Found`);
      res.status(200).json(successResponse("해당 targetMemberId를 갖는 socket 객체가 존재하지 않습니다. friend-online event를 emit하지 않습니다."));
    }

    // targetMember에게 emit
    try {
      emitFriendOnline(io, targetMemberSockets, memberId);
    } catch (error) {
      logger.error(
        `[POST] /internal/socket/friend/online/${memberId}  |  IP: ${req.ip} | Friend Online Event Emit Request Failed - targetMemberId:${targetMemberId}, SOCKET503`
      );
      res.status(500).json(failResponse("SOCKET503", "targetMemberId에 해당하는 socket이 존재하지만 friend-online event emit에 실패했습니다."));
    }

    // 현재 연결된 socket 중 해당 memberId를 가진 socket 객체 list 추출
    let memberSockets = [];
    try {
      memberSockets = await getSocketIdsByMemberIds(io, [memberId]);
    } catch (error) {
      logger.error(
        `[POST] /internal/socket/friend/online/${memberId}  |  IP: ${req.ip} | Friend Online Event Emit Request Failed - memberId:${memberId}, SOCKET501`
      );
      res.status(500).json(failResponse("SOCKET501", "해당 memberId를 가진 socket 객체 추출 도중 에러가 발생했습니다."));
    }

    // member에게 emit
    try {
      emitFriendOnline(io, memberSockets, targetMemberId);
    } catch (error) {
      logger.error(
        `[POST] /internal/socket/friend/online/${memberId}  |  IP: ${req.ip} | Friend Online Event Emit Request Failed - memberId:${memberId}, SOCKET503`
      );
      res.status(500).json(failResponse("SOCKET503", "memberId에 해당하는 socket이 존재하지만 friend-online event emit에 실패했습니다."));
    }

    logger.info(`[POST] /internal/socket/friend/online/${memberId}  |  IP: ${req.ip} | Friend Online Event Emit Success`);
    res.status(200).json(successResponse("friend-online event emit 성공"));
  };
}

module.exports = (io) => {
  return {
    emitFriendOnlineEvent: emitFriendOnlineEvent(io),
  };
};
