const log = require("../../common/customLogger");

/**
 * memberId list에 해당하는 현재 연결된 socket의 id list를 리턴
 * @param {Object} io
 * @param {Array<int>} memberIdList
 * @returns
 */
async function getSocketIdsByMemberIds(io, memberIdList) {
  let socketIdList = [];
  try {
    const connectedSockets = await io.fetchSockets();
    for (const connSocket of connectedSockets) {
      if (memberIdList.includes(connSocket.memberId)) {
        socketIdList.push({ socketId: connSocket.id, memberId: connSocket.memberId });
      }
    }

    return socketIdList;
  } catch (error) {
    log.error(`Error occured getSocketIdsByMemberIds: ${error.message}`, socket);
  }
}

/**
 * memberId에 해당하는 socket의 socketId 리턴
 * @param {*} io
 * @param {*} memberId
 * @returns
 */
async function getSocketIdByMemberId(io, memberId) {
  try {
    const connectedSockets = await io.fetchSockets();

    for (const connSocket of connectedSockets) {
      if (memberId == connSocket.memberId) {
        return connSocket;
      }
    }
    log.warn(`getSocketIdByMemberId - No matching socket found for memberId: ${memberId}`, undefined);
    return null;
  } catch (error) {
    console.log(error);
  }
}

/**
 * matchingUuiid에 해당하는 socket의 socketId 리턴
 * @param {*} io
 * @param {*} matchingUuid
 * @returns
 */
async function getSocketIdByMatchingUuid(io, matchingUuid) {
  try {
    const connectedSockets = await io.fetchSockets();
    log.debug(`[DEBUG] fetchSockets count: ${connectedSockets.length}`);

    for (const connSocket of connectedSockets) {
      log.debug(`[DEBUG] socketId=${connSocket.id}, matchingUuid=${connSocket.data?.matching?.matchingUuid}`);
      if (matchingUuid == connSocket.data?.matching?.matchingUuid) {
        log.debug(`[DEBUG] ✅ MATCH FOUND`);
        return connSocket;
      }
    }

    // 찾는 matchingUuid에 해당하는 socket이 없을 경우 로그 출력
    log.warn(`getSocketIdByMatchingUuid - No matching socket found for matchingUuid: ${matchingUuid}`, undefined);
    return null;
  } catch (error) {
    log.error(error);
  }
}

module.exports = {
  getSocketIdsByMemberIds,
  getSocketIdByMemberId,
  getSocketIdByMatchingUuid,
};
