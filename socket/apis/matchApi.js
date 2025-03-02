const axios = require("axios");
const JWTTokenError = require("../../common/JWTTokenError");
const log = require("../../common/customLogger")
const config = require("../../common/config");

const API_SERVER_URL = config.API_SERVER_URL;
const JWT_ERR_CODE = config.JWT_ERR_CODE;

/**
 * API 요청 에러 처리 함수
 */
function handleApiError(error, url, socket, method) {
  if (error.response && error.response.data) {
    const { code, message } = error.response.data;
    log.httpError(method, url, socket, code, message);

    if (JWT_ERR_CODE.includes(code)) {
      throw new JWTTokenError(`JWT token Error: ${message}`, code);
    }
    throw new Error(`Failed ${method} request: ${message}`);
  } else {
    log.error(`Request failed: ${error.message}`, socket);
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * 매칭 요청을 초기화하고 우선순위 값을 계산하여 반환하는 API 요청
 * /api/v2/internal/matching/priority/{memberId}
 */
async function fetchMatchingApi(socket, request) {
  const memberId = socket.data.memberId;
  const url = `${API_SERVER_URL}/api/v2/internal/matching/priority/${memberId}`;
  const gameStyleIdList = [request.gameStyle1, request.gameStyle2, request.gameStyle3].filter(Boolean);

  const requestData = {
    gameMode: request.gameMode,
    mike: request.mike,
    matchingType: request.matchingType,
    mainP: request.mainP,
    subP: request.subP,
    wantP: request.wantP,
    gameStyleIdList: gameStyleIdList,
  };

  try {
    log.http("POST", url, socket, `Matching API Request: ${JSON.stringify(requestData)}`);
    const response = await axios.post(url, requestData);

    if (response.data.isSuccess) {
      return response.data.result;
    } 
  } catch (error) {
    handleApiError(error, url, socket, "POST");
  }
}


/**
 * 두 회원의 매칭 상태를 업데이트하는 API 요청
 */
async function updateBothMatchingStatusApi(socket, status, targetMemberId) {
  const url = `${API_SERVER_URL}/v1/internal/${socket.memberId}/matching/status/target/${targetMemberId}`;
  const requestData = { status, gameMode: socket.gameMode };

  try {
    log.http("PATCH", url, socket, `Update both matching status Request: ${JSON.stringify(requestData)}`);
    const response = await axios.patch(url, requestData);

    if (response.data.isSuccess) {
      return response.data.result;
    }
  } catch (error) {
    handleApiError(error, url, socket, "PATCH");
  }
}

/**
 * 회원의 매칭 상태를 업데이트하는 API 요청
 */
async function updateMatchingStatusApi(socket, status) {
  const url = `${API_SERVER_URL}/v1/internal/${socket.memberId}/matching/status`;
  const requestData = { status, gameMode: socket.gameMode };

  try {
    log.http("PATCH", url, socket, `Update matching status Request: ${JSON.stringify(requestData)}`);
    const response = await axios.patch(url, requestData, {
      headers: { Authorization: `Bearer ${socket.token}` }, // JWT 토큰 포함
    });

    if (response.data.isSuccess) {
      return response.data.result;
    }
  } catch (error) {
    handleApiError(error, url, socket, "PATCH");
  }
}

/**
 * 특정 회원과의 매칭 상태를 "FOUND"로 변경하는 API 요청
 */
async function matchingFoundApi(socket, targetMemberId) {
  const url = `${API_SERVER_URL}/v1/internal/${socket.memberId}/matching/found/target/${targetMemberId}/${socket.gameMode}`;

  try {
    log.http("PATCH", url, socket, "Matching Found API Request");
    const response = await axios.patch(url);

    if (response.data.isSuccess) {
      return response.data.result;
    }
  } catch (error) {
    handleApiError(error, url, socket, "PATCH");
  }
}

/**
 * 특정 회원과의 매칭 상태를 "SUCCESS"로 변경하고 채팅방 UUID를 반환하는 API 요청
 */
async function matchingSuccessApi(socket, targetMemberId) {
  const url = `${API_SERVER_URL}/v1/internal/${socket.memberId}/matching/success/target/${targetMemberId}/${socket.gameMode}`;

  try {
    log.http("PATCH", url, socket, "Matching Success API Request");
    const response = await axios.patch(url);

    if (response.data.isSuccess) {
      return response.data.result;
    }
  } catch (error) {
    handleApiError(error, url, socket, "PATCH");
  }
}

module.exports = {
  fetchMatchingApi,
  updateMatchingStatusApi,
  updateBothMatchingStatusApi,
  matchingFoundApi,
  matchingSuccessApi,
};
