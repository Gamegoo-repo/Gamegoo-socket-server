const { emitError, emitConnectionJwtError } = require("../../emitters/errorEmitter");
const JWTTokenError = require("../../../common/JWTTokenError");
const log = require("../../../common/customLogger");

const { fetchFriends } = require("../../apis/friendApi");
const { emitFriendOnline, emitSetFriendList } = require("../../emitters/friendEmitter");
const { getSocketIdsByMemberIds } = require("../../common/memberSocketMapper");

/**
 * socket 초기화 즉시 실행될 메소드
 * @param {*} socket
 * @param {*} io
 */
async function initializeFriend(socket, io) {
  try {
    // (#1-13),(#2-9) 해당 회원의 친구 목록 조회 api 요청
    // (#1-14),(#2-10) 친구 목록 조회 정상 응답 받음
    const friendIdList = await fetchFriends(socket);

    // 친구 memberId로 socketId 찾기
    const friendSocketList = await getSocketIdsByMemberIds(io, friendIdList);

    // (#1-15),(#2-11) 친구 소켓에게 "friend-online" event emit
    emitFriendOnline(io, friendSocketList, socket.memberId);

    // (#1-16),(#2-12) 이 소켓에게 "init-online-friend-list" event emit
    emitSetFriendList(socket, friendSocketList);
  } catch (error) {
    log.error(`Error during initializeFriend: ${error.message}`, socket);
    if (error instanceof JWTTokenError) {
      emitConnectionJwtError(socket);
    } else {
      emitError(socket, error.message);
    }
  }
}

module.exports = { initializeFriend };
