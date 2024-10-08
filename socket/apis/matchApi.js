const axios = require("axios");

const JWTTokenError = require("../../common/JWTTokenError");
const logger = require("../../common/winston");

const config = require("../../common/config");
const API_SERVER_URL = config.apiServerUrl;

/**
 * 매칭 요청 저장, 우선순위 값 계산 후, 우선순위 계산 결과 및 내 매칭 요청 정보 리턴하는 API 요청
 * @param {*} socket
 * @returns
 */
async function fetchMatchingApi(socket, request) {
  try {
    const gameStyleIdList = [request.gameStyle1, request.gameStyle2, request.gameStyle3].filter(item => item);
    logger.http("Sending matching API request", `memberId:${socket.memberId}, gameMode:${request.gameMode}, gameStyleIdList:${gameStyleIdList}`);

    const response = await axios.post(
      `${API_SERVER_URL}/v1/matching/priority`,
      {
        gameMode: request.gameMode,
        mike: request.mike,
        matchingType: request.matchingType,
        mainP: request.mainP,
        subP: request.subP,
        wantP: request.wantP,
        gameStyleIdList: gameStyleIdList,
      },
      {
        headers: {
          Authorization: `Bearer ${socket.token}`, // Include JWT token in header
        },
      }
    );
    if (response.data.isSuccess) {
      logger.info("Successfully fetched matching data from API", `memberId:${socket.memberId}`);
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error("JWT Token Error during fetchMatchingApi", `memberId:${socket.memberId}, code:${data.code}, message:${data.message}`);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      logger.error("fetchMatchingApi API failed", `memberId:${socket.memberId}, code:${data.code}, message:${data.message}`);
      throw new Error(`Failed POST matching API: ${data.message}`);
    } else {
      logger.error("fetchMatchingApi request failed", `URL:${API_SERVER_URL}/v1/matching/priority, error:${error.message}`);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

/**
 * 나+상대방의 매칭 상태를 수정하는 API 요청
 * @param {*} socket
 * @param {*} status
 * @param {*} targetMemberId
 * @returns
 */
async function updateBothMatchingStatusApi(socket, status, targetMemberId) {
  try {
    logger.http(
      "Sending 'update both matching status' API request",
      `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, status:${status}, gameMode:${socket.gameMode}`
    );

    const response = await axios.patch(
      `${API_SERVER_URL}/v1/matching/status/target/${targetMemberId}`,
      {
        status: status,
        gameMode: socket.gameMode,
      },
      {
        headers: {
          Authorization: `Bearer ${socket.token}`, // Include JWT token in header
        },
      }
    );

    if (response.data.isSuccess) {
      logger.info(
        "Successfully updated both matching statuses",
        `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, status:${status}, gameMode:${socket.gameMode}`
      );
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error(
          "JWT Token Error during 'update both matching status' API request",
          `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, code:${data.code}, message:${data.message}`
        );
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }

      logger.error(
        "Failed 'update both matching status' API request",
        `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, message:${data.message}`
      );
      throw new Error(`Failed PATCH both matching status:  ${data.message}`);
    } else {
      logger.error(
        "Request failed during 'update both matching status' API",
        `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, errorMessage:${error.message}`
      );
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

/**
 * 해당 socket 회원의 매칭 기록 status를 변경하는 API 요청
 * @param {*} socket
 * @param {*} status
 * @returns
 */
async function updateMatchingStatusApi(socket, status) {
  try {
    logger.http("Sending 'update matching status' API request", `memberId:${socket.memberId}, status:${status}, gameMode:${socket.gameMode}`);

    const response = await axios.patch(
      `${API_SERVER_URL}/v1/matching/status`,
      {
        status: status,
        gameMode: socket.gameMode,
      },
      {
        headers: {
          Authorization: `Bearer ${socket.token}`, // Include JWT token in header
        },
      }
    );

    if (response.data.isSuccess) {
      logger.info("Successfully updated matching status", `memberId:${socket.memberId}, status:${status}, gameMode:${socket.gameMode}`);
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error("JWT Token Error during 'update matching status' API request", `memberId:${socket.memberId}, code:${data.code}, message:${data.message}`);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }

      logger.error("Failed 'update matching status' API request", `memberId:${socket.memberId}, message:${data.message}`);
      throw new Error(`Failed PATCH matching status: ${data.message}`);
    } else {
      logger.error("Request failed during 'update matching status' API", `memberId:${socket.memberId}, errorMessage:${error.message}`);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

/**
 * targetMember와의 매칭 기록 status 변경 및 매칭 요청 정보 리턴하는 API 요청
 * @param {*} socket
 * @param {*} targetMemberId
 * @returns
 */
async function matchingFoundApi(socket, targetMemberId) {
  try {
    logger.http("Sending 'matching found' API request", `memberId:${socket.memberId}, targetMemberId:${targetMemberId}, gameMode:${socket.gameMode}`);

    const response = await axios.patch(
      `${API_SERVER_URL}/v1/matching/found/target/${targetMemberId}/${socket.gameMode}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${socket.token}`, // Include JWT token in header
        },
      }
    );

    if (response.data.isSuccess) {
      logger.info("Successfully updated 'matching found' status", `memberId:${socket.memberId}, targetMemberId:${targetMemberId}, gameMode:${socket.gameMode}`);
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error(
          "JWT Token Error during 'matching found' API request",
          `memberId:${socket.memberId}, targetMemberId:${targetMemberId}, code:${data.code}, message:${data.message}`
        );
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }

      logger.error("Failed 'matching found' API request", `memberId:${socket.memberId}, targetMemberId:${targetMemberId}, message:${data.message}`);
      throw new Error(`Failed PATCH matching found: ${data.message}`);
    } else {
      logger.error(
        "Request failed during 'matching found' API",
        `memberId:${socket.memberId}, targetMemberId:${targetMemberId}, errorMessage:${error.message}`
      );
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

/**
 * targetMember와의 매칭 기록 status 변경 및 채팅방 시작해 채팅방 uuid 리턴하는 API 요청
 * @param {*} socket
 * @param {*} targetMemberId
 * @returns
 */
async function matchingSuccessApi(socket, targetMemberId) {
  try {
    logger.http("Sending 'matching success' API request", `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, gameMode:${socket.gameMode}`);

    const response = await axios.patch(
      `${API_SERVER_URL}/v1/matching/success/target/${targetMemberId}/${socket.gameMode}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${socket.token}`, // Include JWT token in header
        },
      }
    );

    if (response.data.isSuccess) {
      logger.info(
        "Successfully received response from 'matching success' API",
        `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, gameMode:${socket.gameMode}`
      );
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        logger.error(
          "JWT Token Error during 'matching success' API request",
          `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, code:${data.code}, message:${data.message}`
        );
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }

      logger.error("Failed 'matching success' API request", `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, message:${data.message}`);
      throw new Error(`Failed PATCH matching success: ${data.message}`);
    } else {
      logger.error(
        "Request failed during 'matching success' API",
        `senderMemberId:${socket.memberId}, targetMemberId:${targetMemberId}, errorMessage:${error.message}`
      );
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchMatchingApi,
  updateMatchingStatusApi,
  updateBothMatchingStatusApi,
  matchingFoundApi,
  matchingSuccessApi,
};
