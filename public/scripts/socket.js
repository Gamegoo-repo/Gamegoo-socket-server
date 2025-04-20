import { setupSocketEmitters } from "./socketEmitters.js";
import { setupSocketListeners } from "./socketListeners.js";

export let socket;
// 전역 상태 객체
export const state = {
  socketId: null,
  memberId: null, // 이 사용자의 memberId
  tier: null, // 이 사용자의 tier
  matchingUuid: null,
  onlineFriendMemberIdList: [], // 현재 온라인인 친구의 memberId
  currentChattingMemberId: null, // 현재 이 사용자가 보고 있는 채팅방의 상대 memberId
  currentViewingChatroomUuid: null, // 현재 이 사용자가 보고 있는 채팅방의 uuid
  messagesFromThisChatroom: [], // 현재 보고 있는 채팅방의 메시지 목록
  hasNextChat: false, // 채팅 내역 조회를 위해, 다음 채팅내역이 존재하는지 여부 저장
  currentSystemFlag: null, // 현재 채팅방에서 메시지 전송 시 보내야할 systemFlag 저장
};

export function connectSocket(jwtToken = null) {
  // jwtToken이 있을 경우에만 auth 옵션을 추가
  const options = {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  };

  if (jwtToken) {
    options.auth = { token: jwtToken };
  }

  socket = io(options); // 소켓 연결 시 옵션 적용

  socket.on("connect", () => {
    state.socketId = socket.id;
    console.log("Connected to server. Socket ID:", socket.id);
    alert("Connected to server. Socket ID: " + socket.id);
  });

  setupSocketListeners(socket, state);
  setupSocketEmitters(socket, state);
}

// 화면 새로 로드 시 socket 다시 연결
window.addEventListener("load", () => {
  const jwtToken = localStorage.getItem("jwtToken");
  connectSocket(jwtToken);
});

// 첫 접속 시 sessionStorage에 플래그 설정
window.addEventListener("load", () => {
  // 새로고침 또는 처음 접속 시 sessionStorage에 플래그 설정
  sessionStorage.setItem("sessionActive", "true");
});

// 창을 닫을 때 jwt token 스토리지에서 제거
window.addEventListener("beforeunload", (event) => {
  // sessionStorage에 값이 없으면 창이 닫히는 것으로 판단
  if (!sessionStorage.getItem("sessionActive")) {
    // 창을 닫을 때만 localStorage에서 jwtToken 삭제
    localStorage.removeItem("jwtToken");
  }
});

// 매칭 성공 후 채팅방 페이지 연결된 경우
document.addEventListener("DOMContentLoaded", () => {
  // 세션 스토리지에서 chatroomUuid
  const chatroomUuid = sessionStorage.getItem("fromMatchPage");

  if (chatroomUuid) {
    enterChatroom(chatroomUuid);

    // 플래그 삭제 (한 번만 동작하게 함)
    sessionStorage.removeItem("fromMatchPage");
  }
});
