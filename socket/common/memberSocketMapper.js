const logger = require("../../common/winston");

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
    logger.error(`Error occured getSocketIdsByMemberIds: ${error.message}`);
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
    logger.debug(`getSocketIdByMemberId - No matching socket found for memberId:${memberId}`);
    return null;
  } catch (error) {
    logger.error(`Error occured getSocketIdByMemberId: ${error.message}`);
  }
}

module.exports = {
  getSocketIdsByMemberIds,
  getSocketIdByMemberId,
};
