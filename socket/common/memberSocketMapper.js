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
      console.log(connSocket.memberId);
      if (memberId == connSocket.memberId) {
        return connSocket;
      }
    }
    console.log(`getSocketIdByMemberId - No matching socket found for memberId:${memberId}`);
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

    for (const connSocket of connectedSockets) {
      if (matchingUuid == connSocket.data.matching,matchingUuid) {
        return connSocket;
      }
    }
    console.log(`getSocketIdByMemberId - No matching socket found for matchingUuid:${matchingUuid}`);
    return null;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  getSocketIdsByMemberIds,
  getSocketIdByMemberId,
  getSocketIdByMatchingUuid
};
