const axios = require("axios");

const JWTTokenError = require("../../common/JWTTokenError");

const config = require("../../common/config");
const API_SERVER_URL = config.apiServerUrl;

/**
 * 매칭 정보를 기록하고 우선순위 값을 가져오는 API
 * @param {*} socket
 * @returns
 */
async function fetchMatching(socket, request) {
    try {

        const gameStyleIdList = [request.gameStyle1, request.gameStyle2, request.gameStyle3];
        console.log(socket.token);
        const response = await axios.post(`${API_SERVER_URL}/v1/matching/priority`, {

            gameMode: request.gameMode,
            mike: request.mike,
            matchingType: request.matchingType,
            mainP: request.mainP,
            subP: request.subP,
            wantP: request.wantP,
            gameStyleIdList: gameStyleIdList
        },
            {
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
            console.error("Failed POST matching API ", data.message);
            throw new Error(`Failed POST matching API: ${data.message}`);
        } else {
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}

/**
 * 매칭 상태를 수정하는 API
 * @param {*} socket
 * @param {*} request
 * @returns
 */
async function updateMatchingStatus(socket, status) {
    try {
        const response = await axios.put(`${API_SERVER_URL}/v1/matching`, {
            status: status
        }, {
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
            console.error("Failed PUT matching status API ", data.message);
            throw new Error(`Failed PUT matching status API: ${data.message}`);
        } else {
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}

module.exports = {
    fetchMatching, updateMatchingStatus
};
