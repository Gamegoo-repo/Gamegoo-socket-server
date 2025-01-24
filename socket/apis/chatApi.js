const axios = require("axios");

const JWTTokenError = require("../../common/JWTTokenError");
const log = require("../../common/customLogger");
const config = require("../../common/config");

const API_SERVER_URL = config.API_SERVER_URL;
const JWT_ERR_CODE = config.JWT_ERR_CODE;

/**
 * 현재 회원이 속한 채팅방의 uuid 목록을 요청하는 메소드
 * @param {*} socket
 * @returns
 */
async function fetchChatroomUuid(socket) {
  try {
    const url = `${API_SERVER_URL}/api/v2/internal/${socket.memberId}/chatroom/uuid`;
    log.http("GET", url, socket, "get chatroom uuid Request");

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
      throw new Error(`Failed GET chatroom UUID: ${data.message}`);
    } else {
      log.error(`'fetchChatroomUuid' Request failed: ${error.message}`, socket);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

/**
 * 해당 채팅방에 메시지를 등록을 요청하는 메소드
 * @param {*} socket
 * @param {*} chatroomUuid
 * @param {*} requestData
 * @returns
 */
async function postChatMessage(socket, chatroomUuid, requestData) {
  try {
    const url = `${API_SERVER_URL}/api/v2/internal/${socket.memberId}/chat/${chatroomUuid}`;
    log.http("POST", url, socket, `post chat message Request: ${JSON.stringify(requestData)}`);

    const response = await axios.post(url, requestData);
    if (response.data.status == 200) {
      return response.data.data;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      log.httpError("POST", url, socket, data.code, data.message);

      if (JWT_ERR_CODE.includes(data.code)) {
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      throw new Error(`Failed POST chat message: ${data.message}`);
    } else {
      log.error(`'postChatMessage' Request failed: ${error.message}`, socket);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

/**
 * 매칭을 통한 채팅방 시작 테스트용 API 요청 메소드
 * @param {*} socket
 * @param {*} targetMemberId
 */
async function startTestChattingByMatching(socket, targetMemberId) {
  try {
    const url = `${API_SERVER_URL}/api/v2/chat/start/matching/${socket.memberId}/${targetMemberId}`;
    log.http("GET", url, socket, "start chat by matching Request");

    const response = await axios.get(url);
    if (response.data.status == 200) {
      return response.data.data;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      log.httpError("GET", url, socket, data.code, data.message);

      if (JWT_ERR_CODE.includes(data.code)) {
        console.error("JWT token Error: ", data.message);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      throw new Error(`Failed GET start matching chat test: ${data.message}`);
    } else {
      log.error(`'startTestChattingByMatching' Request failed: ${error.message}`, socket);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchChatroomUuid,
  postChatMessage,
  startTestChattingByMatching,
};
