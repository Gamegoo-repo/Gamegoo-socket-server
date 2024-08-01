let socket;
let memberId = null; // 이 사용자의 memberId 저장
let onlineFriendMemberIdList = []; // 현재 온라인인 친구의 memberId 저장
let currentChattingMemberId = null; // 현재 이 사용자가 보고 있는 채팅방의 상대 memberId 저장
let currentViewingChatroomUuid = null; // 현재 이 사용자가 보고 있는 채팅방의 uuid 저장
let messagesFromThisChatroom = []; // 현재 보고 있는 채팅방의 메시지 목록
let hasNextChat = false; // 채팅 내역 조회를 위해, 다음 채팅내역이 존재하는지 여부 저장

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

  // friend-offline event listener
  socket.on("friend-offline", (response) => {
    const memberId = response.data.memberId;
    // (#5-2) 친구 목록의 온라인 여부 html 변경
    const li = document.querySelector(`li[data-member-id='${response.data.memberId}']`);

    if (li) {
      const statusElement = li.querySelector("span.online");
      if (statusElement) {
        statusElement.textContent = "(offline)";
        statusElement.classList.remove("online");
        statusElement.classList.add("offline");
      }
    }

    // (#5-3) onlineFriendMemberIdList에서 해당 memberId 제거
    onlineFriendMemberIdList = onlineFriendMemberIdList.filter((id) => id !== memberId);

    console.log(`Friend ID: ${memberId} is offline`);
    console.log("Updated online Friend Member Id List:", onlineFriendMemberIdList);

    // (#5-4) 현재 채팅 중인 memberId와 동일한 경우 상태 텍스트 변경
    if (currentChattingMemberId === memberId) {
      const chatroomHeader = document.querySelector(".column.chatroom h2");
      const statusElement = chatroomHeader.querySelector("span");
      if (statusElement) {
        statusElement.textContent = "(offline)";
        statusElement.classList.remove("online");
        statusElement.classList.add("offline");
      }
    }
  });

  // my-message-broadcast-success event listener
  socket.on("my-message-broadcast-success", (response) => {
    // (#10-6) messagesFromThisChatroom array 업데이트
    const { chatroomUuid, ...newMessage } = response.data;

    messagesFromThisChatroom.push(newMessage);

    console.log("============== messagesFromThisChatroom Updated ==============");
    console.log(messagesFromThisChatroom);

    // (#10-7) 내가 보낸 메시지 요소 생성
    const messagesElement = document.getElementById("messages");
    const li = document.createElement("li");
    li.classList.add("message-item");
    li.classList.add("mine");
    li.innerHTML = `
                                              <div class="message-content">
                                                <img src="${response.data.senderProfileImg}" alt="Profile Image" width="30" height="30">
                                                <div>
                                                  <p class="sender-name">${response.data.senderName}</p>
                                                  <p class="message-text">${response.data.message}</p>
                                                  <p class="message-time">${new Date(response.data.createdAt).toLocaleString()}</p>
                                                </div>
                                              </div>
                                            `;
    messagesElement.appendChild(li);

    // (#10-8) 채팅방 목록 내 element 업데이트
    // 채팅방 목록 내의 마지막 전송시각 업데이트
    const chatroomItemLastTime = document.querySelector(`.chatroom-item[data-chatroom-uuid="${currentViewingChatroomUuid}"] p[last-msg-time]`);
    if (chatroomItemLastTime) {
      chatroomItemLastTime.textContent = `${new Date(response.data.createdAt).toLocaleString()}`;
    } else {
      console.error(`Could not find chatroom item with UUID ${currentViewingChatroomUuid} to update last msg time.`);
    }

    // 채팅방 목록 내의 마지막 메시지 업데이트
    const chatroomItemLastMsg = document.querySelector(`.chatroom-item[data-chatroom-uuid="${currentViewingChatroomUuid}"] p[last-msg-text]`);
    if (chatroomItemLastMsg) {
      chatroomItemLastMsg.textContent = response.data.message;
    } else {
      console.error(`Could not find chatroom item with UUID ${currentViewingChatroomUuid} to update last msg text.`);
    }

    // 채팅방 목록 내 li 요소 재정렬
    reorderChatroomsByLastMsgTime();
  });

  // chat-message event listener
  socket.on("chat-message", (response) => {
    // 메시지가 온 채팅방이 현재 보고있는 채팅방인 경우
    if (response.data.chatroomUuid === currentViewingChatroomUuid) {
      // (#11-2) messagesFromThisChatroom array 업데이트
      const { chatroomUuid, ...newMessage } = response.data;

      messagesFromThisChatroom.push(newMessage);

      console.log("============== messagesFromThisChatroom Updated ==============");
      console.log(messagesFromThisChatroom);

      // (#11-3) 채팅 메시지 요소 동적 생성
      const messagesElement = document.getElementById("messages");
      const li = document.createElement("li");
      li.classList.add("message-item");
      if (response.data.senderId === memberId) {
        li.classList.add("mine");
      }
      li.innerHTML = `
                                              <div class="message-content">
                                                <img src="${response.data.senderProfileImg}" alt="Profile Image" width="30" height="30">
                                                <div>
                                                  <p class="sender-name">${response.data.senderName}</p>
                                                  <p class="message-text">${response.data.message}</p>
                                                  <p class="message-time">${new Date(response.data.createdAt).toLocaleString()}</p>
                                                </div>
                                              </div>
                                            `;
      messagesElement.appendChild(li);

      // (#11-4) 8080에게 해당 채팅 메시지를 읽었음 요청 전송
      readChatApi(currentViewingChatroomUuid, response.data.timestamp);
    } else {
      // 내가 보고있는 채팅방에서 온 메시지가 아닌 경우
      // (#11-6) 해당 메시지의 전송자가 내가 아닌 경우에만 채팅방 목록 내의 읽지 않은 메시지 개수 업데이트
      if (response.data.senderId != memberId) {
        const chatroomItemNewCnt = document.querySelector(`.chatroom-item[data-chatroom-uuid="${response.data.chatroomUuid}"] p[data-new-count]`);
        if (chatroomItemNewCnt) {
          // 현재 텍스트 내용을 숫자로 변환하여 1 증가시킨 후 다시 설정
          const currentCount = parseInt(chatroomItemNewCnt.textContent);
          chatroomItemNewCnt.textContent = `${currentCount + 1}`;
        } else {
          console.error(`Could not find chatroom item with UUID ${response.data.chatroomUuid} to update new message count.`);
        }
      }
    }

    // (#11-7) 채팅방 목록 element 업데이트
    // 채팅방 목록 내의 마지막 전송시각 업데이트
    const chatroomItemLastTime = document.querySelector(`.chatroom-item[data-chatroom-uuid="${response.data.chatroomUuid}"] p[last-msg-time]`);
    if (chatroomItemLastTime) {
      chatroomItemLastTime.textContent = `${new Date(response.data.createdAt).toLocaleString()}`;
    } else {
      console.error(`Could not find chatroom item with UUID ${response.data.chatroomUuid} to update last msg time.`);
    }

    // 채팅방 목록 내의 마지막 메시지 업데이트
    const chatroomItemLastMsg = document.querySelector(`.chatroom-item[data-chatroom-uuid="${response.data.chatroomUuid}"] p[last-msg-text]`);
    if (chatroomItemLastMsg) {
      chatroomItemLastMsg.textContent = response.data.message;
    } else {
      console.error(`Could not find chatroom item with UUID ${response.data.chatroomUuid} to update last msg text.`);
    }
    // 채팅방 목록 li 요소 재정렬
    reorderChatroomsByLastMsgTime();
  });
}

window.addEventListener("load", () => {
  const jwtToken = localStorage.getItem("jwtToken");
  connectSocket(jwtToken);
});

// 채팅방 목록의 각 채팅방 li를 마지막 메시지 전송 시각 기준으로 내림차순 정렬
function reorderChatroomsByLastMsgTime() {
  console.log("reorderChatroomsByLastMsgTime called, 채팅방 목록의 li 요소를 재정렬합니다.");
  const chatroomList = document.getElementById("chatroomList");
  const chatroomItems = Array.from(chatroomList.getElementsByClassName("chatroom-item"));

  chatroomItems.sort((a, b) => {
    const timeA = parseDate(a.querySelector("p[last-msg-time]").innerText.trim());
    const timeB = parseDate(b.querySelector("p[last-msg-time]").innerText.trim());

    return timeB - timeA; // Descending order
  });

  // Clear existing list and append sorted items
  chatroomList.innerHTML = "";
  chatroomItems.forEach((item) => chatroomList.appendChild(item));
}

// toLocaleString()으로 생성된 날짜 string -> Date 로 parsing
function parseDate(dateString) {
  const parts = dateString.match(/(\d+)\. (\d+)\. (\d+)\. (오전|오후) (\d+):(\d+):(\d+)/);
  const year = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10) - 1; // Months are zero-based
  const day = parseInt(parts[3], 10);
  let hour = parseInt(parts[5], 10);
  const minute = parseInt(parts[6], 10);
  const second = parseInt(parts[7], 10);
  const period = parts[4];

  if (period === "오후" && hour < 12) {
    hour += 12;
  } else if (period === "오전" && hour === 12) {
    hour = 0;
  }

  return new Date(year, month, day, hour, minute, second);
}
