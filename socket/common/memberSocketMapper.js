/**
 * memberId에 해당하는 현재 연결된 socket의 id를 리턴
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

module.exports = {
  getSocketIdsByMemberIds,
};
