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
    logger.http("Sending 'fetch friends' API request", `memberId:${socket.memberId}`);
    const response = await axios.get(`${API_SERVER_URL}/v1/internal/${socket.memberId}/friends/ids`);
    if (response.data.isSuccess) {
      logger.info("Successfully fetched friends", `memberId:${socket.memberId}, friendIdList:${response.data.result}`);
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error("JWT Token Error during 'fetch friends' API request", `memberId:${socket.memberId}, code:${data.code}, message:${data.message}`);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      //console.error("Failed GET friend list: ", data.message);
      logger.error("Failed 'fetch friends' API request", `memberId:${socket.memberId}, code:${data.code}, message:${data.message}`);
      throw new Error(`Failed GET friend list: ${data.message}`);
    } else {
      logger.error("Request failed during 'fetch friends' API request", `memberId:${socket.memberId}, errorMessage:${error.message}`);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchFriends,
};
