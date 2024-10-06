const logger = require("../../common/winston");

/**
 * memberId list에 해당하는 현재 연결된 socket의 id list를 리턴
 * @param {Object} io
 * @param {Array<int>} memberIdList
 * @returns
 */
async function getSocketIdsByMemberIds(io, memberIdList) {
  logger.info("getSocketIdsByMemberIds called::", `memberIdList:${memberIdList}`);
  let socketIdList = [];
  try {
    const connectedSockets = await io.fetchSockets();
    logger.debug("Fetched connected sockets", `totalSockets:${connectedSockets.length}`);

    for (const connSocket of connectedSockets) {
      if (memberIdList.includes(connSocket.memberId)) {
        socketIdList.push({ socketId: connSocket.id, memberId: connSocket.memberId });
        logger.debug("Socket matched with memberId", `socketId:${connSocket.id}, memberId:${connSocket.memberId}`);
      }
    }

    logger.info("Completed fetching socket IDs for member IDs,", `resultCount:${socketIdList.length}`);
    return socketIdList;
  } catch (error) {
    logger.error("Error fetching socket IDs", `error:${error.message}`);
  }
}

/**
 * memberId에 해당하는 socket의 socketId 리턴
 * @param {*} io
 * @param {*} memberId
 * @returns
 */
async function getSocketIdByMemberId(io, memberId) {
  logger.info("getSocketIdByMemberId called::", `memberId:${memberId}`);
  try {
    const connectedSockets = await io.fetchSockets();
    logger.debug("Fetched connected sockets", `totalSockets:${connectedSockets.length}`);

    for (const connSocket of connectedSockets) {
      if (memberId == connSocket.memberId) {
        logger.info("Found matching socket for memberId,", `memberId:${memberId}, socketId:${connSocket.id}`);
        return connSocket;
      }
    }
    logger.info("No matching socket found for memberId", `memberId:${memberId}`);
    return null;
  } catch (error) {
    logger.error("Error occurred while fetching socket by memberId", `memberId:${memberId}, error:${error.message}`);
  }
}

module.exports = {
  getSocketIdsByMemberIds,
  getSocketIdByMemberId,
};
