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
    console.log("===================== event_matching_found eventListener called =====================");
    try {
      // (#20-8), (#21-9) 각 socket의 matchingTarget 값 바인딩
      socket.matchingTarget = otherSocket.memberId;
      otherSocket.matchingTarget = socket.memberId;

      // (#20-9) ~ (#20-11), (#21-10) ~ (#21-12) room leave 및 socket priorityTree 초기화
      deleteSocketFromMatching(socket, io, otherSocket, roomName);

      // (#20-12), (#21-13) 8080서버에 매칭 status 변경 API 요청
      await updateBothMatchingStatusApi(socket, "FOUND", otherSocket.memberId);

      console.log("Matching process completed for:", socket.memberId, " & ", otherSocket.memberId);
    } catch (error) {
      console.error("Error handling matching-found event:", error);
    }
  });
}

module.exports = setUpMatchEventsListeners;
