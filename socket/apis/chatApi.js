const axios = require("axios");

const JWTTokenError = require("../../common/JWTTokenError");

const config = require("../../common/config");
const API_SERVER_URL = config.apiServerUrl;

/**
 * 현재 회원이 속한 채팅방의 uuid 목록을 요청하는 메소드
 * @param {*} socket
 * @returns
 */
async function fetchChatroomUuid(socket) {
  try {
    const response = await axios.get(`${API_SERVER_URL}/v1/member/chatroom/uuid`, {
      headers: {
        Authorization: `Bearer ${socket.token}`, // Include JWT token in header
      },
    });
    if (response.data.isSuccess) {
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        console.error("JWT token Error: ", data.message);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      console.error("Failed GET chatroom uuid: ", data.message);
      throw new Error(`Failed GET chatroom uuid: ${data.message}`);
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

async function postChatMessage(socket, chatroomUuid, message) {
  try {
    const response = await axios.post(
      `${API_SERVER_URL}/v1/chat/${chatroomUuid}`,
      { message: message },
      {
        headers: {
          Authorization: `Bearer ${socket.token}`,
        },
      }
    );
    if (response.data.isSuccess) {
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        console.error("JWT token Error: ", data.message);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      console.error("Failed POST chat message: ", data.message);
      throw new Error(`Failed POST chat message: ${data.message}`);
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchChatroomUuid,
  postChatMessage,
};
