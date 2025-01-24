const formatResponse = require("../common/responseFormatter");
const log = require("../../common/customLogger");

/**
 * socketList에 해당하는 socket에게 해당 memberId가 온라인 상태가 되었음을 알리는 메소드
 * @param {*} io
 * @param {*} socketList
 * @param {*} memberId
 */
function emitFriendOnline(io, socketList, memberId) {
  socketList.forEach((socket) => {
    // 소켓에게 friend-online emit
    io.to(socket.socketId).emit("friend-online", formatResponse("friend-online", { memberId }));
    log.emit("friend-online", socket, `member id: ${memberId} is online`);
  });
}

/**
 * 내 소켓에게 온라인인 친구 목록을 초기화해야함을 알리는 메소드
 * @param {*} socket
 * @param {*} friendSocketList
 */
function emitSetFriendList(socket, friendSocketList) {
  const onlineFriendMemberIdList = friendSocketList.map((friend) => friend.memberId);
  socket.emit("init-online-friend-list", formatResponse("init-online-friend-list", { onlineFriendMemberIdList }));
  log.emit("init-online-friend-list", socket, `online friend list: ${onlineFriendMemberIdList}`);
}

/**
 * socketList에 해당하는 socket에게 해당 memberId가 오프라인 상태가 되었음을 알리는 메소드
 * @param {*} io
 * @param {*} socketList
 * @param {*} memberId
 */
function emitFriendOffline(io, socketList, memberId) {
  socketList.forEach((socket) => {
    // 소켓에게 friend-offline emit
    io.to(socket.socketId).emit("friend-offline", formatResponse("friend-offline", { memberId }));
    log.emit("friend-offline", socket, `member id: ${memberId} is offline`);
  });
}

module.exports = {
  emitFriendOnline,
  emitSetFriendList,
  emitFriendOffline,
};
