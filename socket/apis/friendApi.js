const axios = require("axios");

const JWTTokenError = require("../../common/JWTTokenError");
const log = require("../../common/customLogger");
const config = require("../../common/config");

const API_SERVER_URL = config.API_SERVER_URL;
const JWT_ERR_CODE = config.JWT_ERR_CODE;

/**
 * 회원의 친구 목록을 요청하는 메소드
 * @param {*} socket
 * @returns
 */
async function fetchFriends(socket) {
  try {
    const url = `${API_SERVER_URL}/api/v2/internal/${socket.memberId}/friend/ids`;
    log.http("GET", url, socket, "fetch friend list Request");

    const response = await axios.get(url);
    if (response.data.status == 200) {
      return response.data.data;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      log.httpError("GET", url, socket, data.code, data.message);

      if (JWT_ERR_CODE.includes(data.code)) {
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      throw new Error(`Failed GET friend list: ${data.message}`);
    } else {
      log.error(`'fetchFriends' Request failed: ${error.message}`, socket);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchFriends,
};
