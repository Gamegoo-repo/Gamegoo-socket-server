/**
 * socket event 응답을 포맷팅하는 메소드
 * @param {*} eventName
 * @param {*} data
 * @returns
 */
function formatResponse(eventName, data) {
  return {
    event: eventName,
    data: data,
    timestamp: new Date().toISOString(),
  };
}

module.exports = formatResponse;
