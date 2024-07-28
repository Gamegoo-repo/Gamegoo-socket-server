let socket;
let memberId = null; // 이 사용자의 memberId 저장
let onlineFriendMemberIdList = []; // 현재 온라인인 친구의 memberId 저장
let currentChattingMemberId = null; // 현재 이 사용자가 보고 있는 채팅방의 상대 memberId 저장

const loginStatus = document.getElementById("loginStatus");

function connectSocket(jwtToken = null) {
  const options = jwtToken ? { auth: { token: jwtToken } } : {};

  socket = io(options); // (#1-1), (#2-1) socket connection 생성

  socket.on("connect", () => {
    console.log("Connected to server. Socket ID:", socket.id);
    alert("Connected to server. Socket ID: " + socket.id);
  });

  setupSocketListeners();
}

function setupSocketListeners() {
  // member-info event listener
  socket.on("member-info", (response) => {
    loginStatus.textContent = "You are Login User, member Id: " + response.data.memberId;

    // (#1-11),(#2-4) memberId 전역변수 초기화
    memberId = response.data.memberId;
  });

  // init-online-friend-list event listener
  socket.on("init-online-friend-list", (response) => {
    // (#1-21),(#2-13) 현재 온라인인 친구 목록 초기화
    onlineFriendMemberIdList = response.data.onlineFriendMemberIdList;

    // 로그 확인
    console.log("init-online-friend-list event에 대한 listener가 작동합니다.");
    console.log("Online Friend Member ID List:", onlineFriendMemberIdList);
  });

  // friend-online event listener
  socket.on("friend-online", (response) => {
    // (#4-2) 친구 목록의 온라인 여부 html 변경
    const li = document.querySelector(`li[data-member-id='${response.data.memberId}']`);

    if (li) {
      const statusElement = li.querySelector("span.offline");
      if (statusElement) {
        statusElement.textContent = "(online)";
        statusElement.classList.remove("offline");
        statusElement.classList.add("online");
      }
    }

    // (#4-3) 현재 온라인인 친구 목록 업데이트
    onlineFriendMemberIdList.push(response.data.memberId);
    console.log("current online Friend Member Id List:", onlineFriendMemberIdList);

    // (#4-4) 현재 채팅 중인 (채팅창을 보고있는) memberId와 동일한 경우 상태 텍스트 변경
    console.log("friend-online listener: currentChattingMemberId is.. ", currentChattingMemberId);
    if (currentChattingMemberId === response.data.memberId) {
      const chatroomHeader = document.querySelector(".column.chatroom h2");
      const statusElement = chatroomHeader.querySelector("span");
      if (statusElement) {
        statusElement.textContent = "(online)";
        statusElement.classList.remove("offline");
        statusElement.classList.add("online");
      }
    }
  });
}

window.addEventListener("load", () => {
  const jwtToken = localStorage.getItem("jwtToken");
  connectSocket(jwtToken);
});
