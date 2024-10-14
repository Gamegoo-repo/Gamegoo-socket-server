const axios = require("axios");

const JWTTokenError = require("../../common/JWTTokenError");
const logger = require("../../common/winston");

const config = require("../../common/config");
const API_SERVER_URL = config.apiServerUrl;

/**
 * 현재 회원이 속한 채팅방의 uuid 목록을 요청하는 메소드
 * @param {*} socket
 * @returns
 */
async function fetchChatroomUuid(socket) {
  try {
    logger.http("Sending 'fetch chatroom UUID' API request", `memberId:${socket.memberId}, socketId:${socket.id}`);

    const response = await axios.get(`${API_SERVER_URL}/v1/internal/${socket.memberId}/chatroom/uuid`);

    if (response.data.isSuccess) {
      logger.info("Successfully fetched chatroom UUID", `memberId:${socket.memberId}`);
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;

      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error("JWT Token Error during 'fetch chatroom UUID' API request", `memberId:${socket.memberId}, code:${data.code}, message:${data.message}`);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }

      logger.error("Failed 'fetch chatroom UUID' API request", `memberId:${socket.memberId}, message:${data.message}`);
      throw new Error(`Failed GET chatroom UUID: ${data.message}`);
    } else {
      logger.error("Request failed during 'fetch chatroom UUID' API request", `memberId:${socket.memberId}, errorMessage:${error.message}`);
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
    logger.http("Sending POST request to save chat message", `socketId:${socket.id}, chatroomUuid:${chatroomUuid}, requestData:${JSON.stringify(requestData)}`);

    const response = await axios.post(`${API_SERVER_URL}/v1/internal/${socket.memberId}/chat/${chatroomUuid}`, requestData);
    if (response.data.isSuccess) {
      logger.info("Successfully saved chat message", `socketId:${socket.id}, chatroomUuid:${chatroomUuid}, messageId:${response.data.result.messageId}`);
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error(
          "JWT token Error during POST chat message",
          `socketId:${socket.id}, chatroomUuid:${chatroomUuid}, errorCode:${data.code}, errorMessage:${data.message}`
        );
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      logger.error("Failed POST chat message", `socketId:${socket.id}, chatroomUuid:${chatroomUuid}, errorMessage:${data.message}`);
      throw new Error(`Failed POST chat message: ${data.message}`);
    } else {
      logger.error("postChatMessage request failed", `socketId:${socket.id}, chatroomUuid:${chatroomUuid}, errorMessage:${error.message}`);
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
    const response = await axios.get(`${API_SERVER_URL}/v1/chat/start/matching/${socket.memberId}/${targetMemberId}`);
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
      console.error("Failed GET start matching chat test: ", data.message);
      throw new Error(`Failed GET start matching chat test: ${data.message}`);
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchChatroomUuid,
  postChatMessage,
  startTestChattingByMatching,
};
