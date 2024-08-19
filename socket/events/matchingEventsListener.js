const eventEmitter = require("./eventBus");
const { deleteSocketFromMatching } = require("./handlers/matchingHandler");
const { updateBothMatchingStatusApi } = require("../apis/matchApi");

/**
 * matching 관련 events 모듈 listener
 * @param {*} socket
 * @param {*} io
 */
async function setUpMatchEventsListeners(io) {
  eventEmitter.on("event_matching_found", async (socket, otherSocket, roomName) => {
    console.log("===================== eventEmitter called =====================");
    try {
      // 9) ~ 11) room leave 및 socket priorityTree 초기화
      deleteSocketFromMatching(socket, io, otherSocket, roomName);

      // 12) 8080서버에 매칭 status 변경 API 요청
      await updateBothMatchingStatusApi(socket, "FOUND", otherSocket.memberId);

      console.log("Matching process completed for:", socket.memberId, "and", otherSocket.memberId);
    } catch (error) {
      console.error("Error handling matching-found event:", error);
    }
  });
}

module.exports = setUpMatchEventsListeners;
