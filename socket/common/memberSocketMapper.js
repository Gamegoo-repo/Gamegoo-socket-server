const log = require("../../common/customLogger");
const { connectSocket } = require("../../public/scripts/socket");

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
      if (memberIdList.includes(connSocket.data.matching.memberId)) {
        socketIdList.push({ socketId: connSocket.id, memberId: connSocket.data.matching.memberId });
      }
    }

    return socketIdList;
  } catch (error) {
    log.error(`Error occured getSocketIdsByMemberIds: ${error.message}`,socket);
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
      if (memberId == connSocket.data.matching.memberId) {
        return connSocket;
      }
    }
    log.debug(`getSocketIdByMemberId - No matching socket found for memberId:${memberId}`,socket);
    return null;
  } catch (error) {
    log.error(`Error occured getSocketIdByMemberId: ${error.message}`,connectSocket);
  }
}

module.exports = {
  getSocketIdsByMemberIds,
  getSocketIdByMemberId,
};
