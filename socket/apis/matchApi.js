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
    log.http("POST", url, socket, `matching-request`);
    const response = await axios.post(url, requestData);
    if (response.status==200) {
      return response.data.data;
    } 
  } catch (error) {
    handleApiError(error, url, socket, "POST");
  }
}


/**
 * 두 회원의 매칭 상태를 업데이트하는 API 요청
 * /api/v2/internal/matching/status/target/{matchingUuid}/{status}
 */
async function updateBothMatchingStatusApi(socket, status) {
  const url = `${API_SERVER_URL}/api/v2/internal/matching/status/target/${socket.data.matchingUuid}/${status}`;

  try {
    log.http("PATCH", url, socket, `update both matching status`);
    const response = await axios.patch(url);
    if (response.status==200) {
      return response.data.data;
    } 
  } catch (error) {
    handleApiError(error, url, socket, "PATCH");
  }
}

/**
 * 회원의 매칭 상태를 업데이트하는 API 요청
 * /api/v2/internal/matching/status/{matchingUuid}/{status}
 */
async function updateMatchingStatusApi(socket, status) {
  const url = `${API_SERVER_URL}/api/v2/internal/matching/status/${socket.data.matchingUuid}/${status}`;

  try {
    log.http("PATCH", url, socket, `update matching status`);
    const response = await axios.patch(url);
    if (response.status==200) {
      return response.data.data;
    } 
  } catch (error) {
    handleApiError(error, url, socket, "PATCH");
  }
}

/**
 * status Found로 변경 & target Member 지정
 * /api/v2/internal/matching/found/{matchingUuid}/{targetMatchingUuid}
 */
async function matchingFoundApi(socket) {
  const url = `${API_SERVER_URL}/api/v2/internal/matching/found/${socket.matchingUuid}/${socket.targetMatchingUuid}`;

  try {
    log.http("PATCH", url, socket, "Matching Found API Request");
    const response = await axios.patch(url);
    if (response.status==200) {
      return response.data.data;
    } 
  } catch (error) {
    handleApiError(error, url, socket, "PATCH");
  }
}

/**
 * status Success로 변경 & target Member 지정
 * /api/v2/internal/matching/success/{matchingUuid}/{targetMatchingUuid}
 */
async function matchingSuccessApi(socket) {
  const url = `${API_SERVER_URL}/api/v2/internal/matching/success/${socket.matchingUuid}/${socket.targetMatchingUuid}`;

  try {
    log.http("PATCH", url, socket, "Matching Success API Request");
    const response = await axios.patch(url);
    if (response.status==200) {
      return response.data.data;
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
