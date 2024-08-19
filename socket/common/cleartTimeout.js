/**
 * 해당 socket의 retryTimeouts array에 있는 모든 timer ID를 clearTimeout
 * @param {*} socket
 */
async function clearAllTimeout(socket) {
  // 모든 setTimeout 타이머를 취소
  if (socket.retryTimeouts) {
    socket.retryTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    socket.retryTimeouts = []; // 타이머 배열 초기화
    console.log("All matching timeouts cleared for socket:", socket.id);
  }
}

module.exports = clearAllTimeout;
