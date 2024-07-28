const { emitError, emitJWTError } = require("../../emitters/errorEmitter");
const JWTTokenError = require("../../../common/JWTTokenError");

const { fetchFriends } = require("../../apis/friendApi");
const { emitFriendOnline, emitSetFriendList } = require("../../emitters/friendEmitter");

/**
 * socket 초기화 즉시 실행될 메소드
 * @param {*} socket
 * @param {*} io
 */
function initializeFriend(socket, io) {
  // (#1-16),(#2-9) 해당 회원의 친구 목록 조회 api 요청
  // (#1-17),(#2-10) 친구 목록 조회 정상 응답 받음
  fetchFriends(socket)
    .then(async (friends) => {
      // 친구 중에서 현재 온라인인 친구의 소켓 id 및 memberId array 생성
      const friendIdList = friends.map((friend) => friend.memberId);

      // 친구 memberId로 socketId 찾기
      const friendSocketList = await getSocketIdByMemberId(io, friendIdList);

      // (#1-18),(#2-11) 친구 소켓에게 "friend-online" event emit
      emitFriendOnline(io, friendSocketList, socket.memberId);

      // (#1-19),(#2-12) 이 소켓에게 "init-online-friend-list" event emit
      emitSetFriendList(socket, friendSocketList);
    })
    .catch((error) => {
      if (error instanceof JWTTokenError) {
        console.error("JWT Token Error:", error.message);
        emitJWTError(socket, error.code, error.message);
      } else {
        console.error("Error fetching friend list data:", error);
        emitError(socket, error.message);
      }
    });
}

module.exports = { initializeFriend };
