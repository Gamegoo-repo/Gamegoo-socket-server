export function setupSocketEmitters(socket, state) {
  // 채팅 전송 폼 제출 시
  const form = document.getElementById("form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
      const msg = input.value;
      console.log("CHAT-MESSAGE EVENT EMIT ====== currentSystemFlag: ", state.currentSystemFlag);
      if (state.currentSystemFlag) {
        // 보내야 할 systemFlag가 있는 경우
        // (#10-2) "chat-message" event emit
        socket.emit("chat-message", { uuid: state.currentViewingChatroomUuid, message: msg, system: state.currentSystemFlag });

        // systemFlag 초기화
        state.currentSystemFlag = null;
      } else {
        // (#10-1) "chat-message" event emit
        socket.emit("chat-message", { uuid: state.currentViewingChatroomUuid, message: msg });
      }
      input.value = "";
    }
  });
}
