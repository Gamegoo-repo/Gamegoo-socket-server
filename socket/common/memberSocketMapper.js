/**
 * memberId list에 해당하는 현재 연결된 socket의 id list를 리턴
 * @param {Object} io
 * @param {Array<int>} memberIdList
 * @returns
 */
async function getSocketIdsByMemberIds(io, memberIdList) {
  let socketIdList = [];
  const connectedSockets = await io.fetchSockets();
  for (const connSocket of connectedSockets) {
    if (memberIdList.includes(connSocket.memberId)) {
      socketIdList.push({ socketId: connSocket.id, memberId: connSocket.memberId });
    }
  }

  return socketIdList;
}

/**
 * memberId에 해당하는 socket의 socketId 리턴
 * @param {*} io
 * @param {*} memberId
 * @returns
 */
async function getSocketIdByMemberId(io, memberId) {
  const connectedSockets = await io.fetchSockets();
  console.log("requested memberId: ", memberId);
  for (const connSocket of connectedSockets) {
    console.log("connSocket.memberId: ", connSocket.memberId);
    if (memberId == connSocket.memberId) {
      return connSocket;
    }
  }
  return null;
}

module.exports = {
  getSocketIdsByMemberIds,
  getSocketIdByMemberId,
};
