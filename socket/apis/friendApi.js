const axios = require("axios");
const JWTTokenError = require("../../common/JWTTokenError");
const logger = require("../../common/winston");

const config = require("../../common/config");
const API_SERVER_URL = config.apiServerUrl;

/**
 * 회원의 친구 목록을 요청하는 메소드
 * @param {*} socket
 * @returns
 */
async function fetchFriends(socket) {
  try {
    const response = await axios.get(`${API_SERVER_URL}/v1/friends/ids`, {
      headers: {
        Authorization: `Bearer ${socket.token}`, // Include JWT token in header
      },
    });
    if (response.data.isSuccess) {
      logger.debug("Successfully fetched friends", `memberId:${socket.memberId}, friendIdList:${friendIdList}`);
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error("JWT Token Error during fetchFriends", `memberId:${socket.memberId}, code:${data.code}, message:${data.message}`);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      //console.error("Failed GET friend list: ", data.message);
      logger.error("Failed fetchFriends API", `memberId:${socket.memberId}, errorCode:${data.code}, errorMessage:${data.message}`);
      throw new Error(`Failed GET friend list: ${data.message}`);
    } else {
      logger.error("fetchFriends request failed", `URL:${API_SERVER_URL}/v1/friends/ids, error:${error.message}`);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchFriends,
};
