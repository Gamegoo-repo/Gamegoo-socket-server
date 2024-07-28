const JWTTokenError = require("../../common/JWTTokenError");

const config = require("../../common/config");
const API_SERVER_URL = config.apiServerUrl;

/**
 * 현재 회원이 속한 채팅방의 uuid 목록을 요청하는 메소드
 * @param {*} socket
 * @returns
 */
async function fetchChatroomUuid(socket) {
  const response = await fetch(`${API_SERVER_URL}/v1/member/chatroom/uuid`, {
    headers: {
      Authorization: `Bearer ${socket.token}`, // Include JWT token in header
    },
  });
  const data = await response.json();
  if (data.isSuccess) {
    return data.result;
  } else {
    if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
      console.error("JWT token Error: ", data.message);
      throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
    }
    console.error("Failed to fetch chatroom uuid: ", data.message);
    throw new Error(`Failed to fetch chatroom uuid: ${data.message}`);
  }
}

module.exports = {
  fetchChatroomUuid,
};
