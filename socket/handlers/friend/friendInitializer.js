const { emitError, emitJWTError } = require("../../emitters/errorEmitter");
const JWTTokenError = require("../../../common/JWTTokenError");
const logger = require("../../../common/winston");

const { fetchFriends } = require("../../apis/friendApi");
const { emitFriendOnline, emitSetFriendList } = require("../../emitters/friendEmitter");
const { getSocketIdsByMemberIds } = require("../../common/memberSocketMapper");

/**
 * socket 초기화 즉시 실행될 메소드
 * @param {*} socket
 * @param {*} io
 */
function initializeFriend(socket, io) {
  // (#1-13),(#2-9) 해당 회원의 친구 목록 조회 api 요청
  fetchFriends(socket)
    .then(async (friendIdList) => {
      // (#1-14),(#2-10) 친구 목록 조회 정상 응답 받음
      logger.info("Successfully fetched Friends", `memberId:${socket.memberId}`);

      // 친구 memberId로 socketId 찾기
      const friendSocketList = await getSocketIdsByMemberIds(io, friendIdList);

      // (#1-15),(#2-11) 친구 소켓에게 "friend-online" event emit
      emitFriendOnline(io, friendSocketList, socket.memberId);

      // (#1-16),(#2-12) 이 소켓에게 "init-online-friend-list" event emit
      emitSetFriendList(socket, friendSocketList);
    })
    .catch((error) => {
      if (error instanceof JWTTokenError) {
        logger.error(
          "JWT Token Error occurred while fetching friend list",
          `memberId:${socket.memberId}, errorCode:${error.code}, errorMessage:${error.message}`
        );
        emitJWTError(socket, error.code, error.message);
      } else {
        logger.error("Error fetching friend list data", `memberId:${socket.memberId}, errorMessage:${error.message}`);
        emitError(socket, error.message);
      }
    });
}

module.exports = { initializeFriend };
