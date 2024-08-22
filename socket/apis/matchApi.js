const axios = require("axios");

const JWTTokenError = require("../../common/JWTTokenError");

const config = require("../../common/config");
const API_SERVER_URL = config.apiServerUrl;

/**
 * 매칭 요청 저장, 우선순위 값 계산 후, 우선순위 계산 결과 및 내 매칭 요청 정보 리턴하는 API 요청
 * @param {*} socket
 * @returns
 */
async function fetchMatchingApi(socket, request) {
  try {
    const gameStyleIdList = [request.gameStyle1, request.gameStyle2, request.gameStyle3];
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
      return response.data.result;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (["JWT400", "JWT401", "JWT404"].includes(data.code)) {
        console.error("JWT token Error: ", data.message);
        throw new JWTTokenError(`JWT token Error: ${data.message}`, data.code);
      }
      console.error("Failed POST matching API ", data.message);
      throw new Error(`Failed POST matching API: ${data.message}`);
    } else {
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
    const response = await axios.patch(
      `${API_SERVER_URL}/v1/matching/status/target/${targetMemberId}`,
      {
        status: status,
      },
      {
        headers: {
          Authorization: `Bearer ${socket.token}`, // Include JWT token in header
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
      console.error("Failed PATCH both matching status: ", data.message);
      throw new Error(`Failed PATCH both matching status:  ${data.message}`);
    } else {
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
    const response = await axios.patch(
      `${API_SERVER_URL}/v1/matching/status`,
      {
        status: status,
      },
      {
        headers: {
          Authorization: `Bearer ${socket.token}`, // Include JWT token in header
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
      console.error("Failed PATCH matching status: ", data.message);
      throw new Error(`Failed PATCH matching status: ${data.message}`);
    } else {
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
    const response = await axios.patch(`${API_SERVER_URL}/v1/matching/found/target/${targetMemberId}`, {
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
      console.error("Failed PATCH matching found: ", data.message);
      throw new Error(`Failed PATCH matching found: ${data.message}`);
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchMatchingApi,
  updateMatchingStatusApi,
  updateBothMatchingStatusApi,
  matchingFoundApi,
};
