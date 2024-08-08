const userEmailInput = document.getElementById("userEmail");
const userPwInput = document.getElementById("userPw");

// 로그인 버튼 클릭 시
loginButton.addEventListener("click", () => {
  const userEmail = userEmailInput.value;
  if (!userEmail) {
    alert("Please enter your Email.");
    return;
  }

  const userPw = userPwInput.value;
  if (!userPw) {
    alert("Please enter your Pw.");
    return;
  }

  // (#1-2) 8080서버로 로그인 요청 보내 jwt 토큰 발급받기
  loginApi(userEmail, userPw).then((result) => {
    // (#1-3) 8080서버로부터 jwt 토큰 정상 응답 받음
    if (result) {
      // (#1-4) jwt 토큰 localStorage에 저장
      const jwtToken = result.accessToken;
      localStorage.setItem("jwtToken", jwtToken);

      alert("Login successful! Token received.");
      console.log("Using existing socket. Socket ID:", socket.id);

      // (#1-5) 8080서버로 나의 회원 정보 요청
      getMemberInfoApi().then((result) => {
        // (#1-6) 8080서버로부터 나의 회원 정보 정상 응답 받음
        if (result) {
          // (#1-7) localStorage에 나의 회원 정보 저장
          localStorage.setItem("profileImg", result.profileImg);
          localStorage.setItem("name", result.gameName);

          // (#1-8) 3000서버로 login api 요청 (소켓 초기화를 위함)
          loginNodeApi();
        }
      });
    }
  });
});

// 친구목록 조회 버튼 클릭 시
fetchFriendsButton.addEventListener("click", () => {
  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    console.error("JWT token is missing.");
    return;
  }

  // (#3-1) 친구 목록 조회 api 요청
  getFriendListApi().then((result) => {
    if (result) {
      // (#3-2) 친구 목록 조회 성공 응답 받음
      const friendsElement = document.getElementById("friendsList");
      friendsElement.innerHTML = ""; // 이전 친구목록 element 비우기

      // (#3-3) 친구 목록 화면 렌더링
      result.forEach((friend) => {
        const li = document.createElement("li");

        // onlineFriendMemberIdList에 존재하는 회원인지 (해당 회원이 현재 온라인인지)에 따라 상태 text 배정
        const isOnline = onlineFriendMemberIdList.includes(friend.memberId);
        const statusText = isOnline ? "online" : "offline";

        // 접속 상태 element 생성 및 class 부여
        const statusElement = document.createElement("span");
        statusElement.textContent = `(${statusText})`;
        statusElement.classList.add(isOnline ? "online" : "offline");

        li.setAttribute("data-member-id", friend.memberId);
        li.innerHTML = `
                  <img src="${friend.memberProfileImg}" alt="${friend.name}'s profile picture" width="30" height="30">
                  <span>${friend.name}</span>
                `;
        li.appendChild(statusElement);

        // 해당 친구 부분 클릭 시, 친구와의 채팅방 시작 api 요청
        li.addEventListener("click", () => {
          startChatApi(friend.memberId)
            .then((result) => {
              // messagesFromThisChatroom array 초기화
              messagesFromThisChatroom = result.chatMessageList.chatMessageDtoList;

              console.log("============== fetch chat messages result ===============");
              console.log(result.chatMessageList);

              // hasNextChat 업데이트
              hasNextChat = result.chatMessageList.has_next;

              // 기존 메시지 element 초기화
              const messagesElement = document.getElementById("messages");
              const shouldScrollToBottom = messagesElement.scrollTop === messagesElement.scrollHeight - messagesElement.clientHeight;

              messagesElement.innerHTML = "";

              // messagesFromThisChatroom의 각 messgae 요소 렌더링
              messagesFromThisChatroom.forEach((message) => {
                const li = document.createElement("li");
                li.classList.add("message-item");
                if (message.senderId === memberId) {
                  li.classList.add("mine");
                }
                li.innerHTML = `
                    <div class="message-content">
                      <img src="${message.senderProfileImg}" alt="Profile Image" width="30" height="30">
                      <div>
                        <p class="sender-name">${message.senderName}</p>
                        <p class="message-text">${message.message}</p>
                        <p class="message-time">${new Date(message.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  `;
                messagesElement.appendChild(li);
              });

              // Scroll to bottom if was already at bottom before fetching new messages or on initial load
              if (shouldScrollToBottom || messagesElement.children.length === 0) {
                messagesElement.scrollTop = messagesElement.scrollHeight;
              }

              // 채팅방 내부 헤더 렌더링
              const chatroomHeader = document.querySelector(".column.chatroom h2");

              // 상대 회원이 현재 온라인인 친구 목록에 있는지 여부를 따져서 상태 text 설정
              const isOnline = onlineFriendMemberIdList.includes(result.memberId);
              const statusText = isOnline ? "online" : "offline";

              // 상태 element에 class 부여
              const statusElement = document.createElement("span");
              statusElement.textContent = `(${statusText})`;
              statusElement.classList.add(isOnline ? "online" : "offline");

              // 헤더의 profile image, name, 상태 element 업데이트
              chatroomHeader.innerHTML = `<img src="${result.memberProfileImg}" alt="Profile Image" width="30" height="30" style="vertical-align: middle;">${result.gameName}`;
              chatroomHeader.appendChild(statusElement);

              // 채팅방 나가기 버튼 생성
              const exitButton = document.createElement("button");
              exitButton.textContent = "나가기";
              exitButton.style.marginLeft = "10px";

              // 채팅방 나가기 버튼 클릭 이벤트 리스너 추가
              exitButton.addEventListener("click", () => {
                exitChatroom(result.uuid);
              });

              // 헤더에 채팅방 나가기 버튼 추가
              chatroomHeader.appendChild(exitButton);

              // 채팅방 목록에 읽지 않은 메시지 개수를 0으로 업데이트
              const chatroomItem = document.querySelector(`.chatroom-item[data-chatroom-uuid="${result.uuid}"] p[data-new-count]`);
              if (chatroomItem) {
                chatroomItem.textContent = "0";
              } else {
                console.error(`Could not find chatroom item with UUID ${result.uuid} to update new count.`);
              }

              // 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 업데이트
              currentViewingChatroomUuid = result.uuid;
              currentChattingMemberId = result.memberId;
            })
            .catch((error) => console.error("Error:", error));
        });

        friendsElement.appendChild(li);
      });
    }
  });
});

// 로그아웃 버튼 클릭 시
logoutButton.addEventListener("click", () => {
  // 로그아웃 버튼 클릭 이벤트 추가
  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    alert("You are not logged in.");
    return;
  }

  // (#7-3) 3000서버에 logout api 호출
  // 8080으로 먼저 logout 요청 보내는게 맞지만, 여기서는 일단 3000으로만 보냄, 추후 추가 예정
  fetch("/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
      "Socket-Id": socket.id,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.isSuccess) {
        alert("Logout successful!");
        // (#7-6) localStorage에서 jwt 삭제
        localStorage.removeItem("jwtToken");
        // 로그아웃 후 페이지 새로고침 또는 다른 후속 조치
        location.reload();
      } else {
        alert("Logout failed.");
      }
    })
    .catch((error) => console.error("Error:", error));
});

// 채팅방 목록 버튼 클릭 시
fetchChatroomsButton.addEventListener("click", () => {
  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    console.error("JWT token is missing.");
    return;
  }

  // (#8-1) 채팅방 목록 조회 api 요청
  getChatroomListApi().then((result) => {
    if (result) {
      // (#8-2) 채팅방 목록 조회 성공 응답 받음
      // 채팅방 목록 element 초기화
      const chatroomListElement = document.getElementById("chatroomList");
      chatroomListElement.innerHTML = "";

      // (#8-3) 채팅방 목록 렌더링
      // api result data를 돌면서 html 요소 생성
      result.forEach((chatroom) => {
        const li = document.createElement("li");
        li.classList.add("chatroom-item");
        li.setAttribute("data-chatroom-uuid", chatroom.uuid); // data-chatroom-uuid 값 세팅

        li.innerHTML = `
                                                            <div>
                                                                <img src="${chatroom.targetMemberImg}" alt="Profile Image" width="30" height="30">
                                                            </div>
                                                            <div class="chatroom-info">
                                                                <span>${chatroom.targetMemberName}</span>
                                                                <p last-msg-text>${chatroom.lastMsg ? chatroom.lastMsg : " "}</p>
                                                            </div>
                                                            <div>
                                                                <p last-msg-time>${new Date(chatroom.lastMsgAt).toLocaleString()}</p>
                                                                <p data-new-count>${chatroom.notReadMsgCnt}</p>
                                                                <button class="enter-chatroom-btn" data-chatroom-uuid="${chatroom.uuid}">채팅방 입장</button>
                                                            </div>
                                                        `;
        chatroomListElement.appendChild(li);
      });

      // 채팅방 입장 버튼에 eventListener 추가
      const enterChatroomButtons = document.querySelectorAll(".enter-chatroom-btn");
      enterChatroomButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          const chatroomUuid = event.target.getAttribute("data-chatroom-uuid");
          enterChatroom(chatroomUuid);
        });
      });
    }
  });
});

// 채팅방 입장 시
function enterChatroom(chatroomUuid) {
  console.log(`Entering chatroom with UUID: ${chatroomUuid}`);
  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    console.error("JWT token is missing.");
    return;
  }

  // (#9-1) 입장한 chatroom의 메시지 내역 조회 api 요청
  enterChatroomApi(chatroomUuid).then((result) => {
    if (result) {
      // (#9-2) 메시지 내역 조회 정상 응답 받음

      // (#9-3) messagesFromThisChatroom array 초기화
      messagesFromThisChatroom = result.chatMessageList.chatMessageDtoList;

      console.log("============== fetch chat messages result ===============");
      console.log(result.chatMessageList);

      // (#9-4) hasNextChat 업데이트
      hasNextChat = result.chatMessageList.has_next;

      // 기존 메시지 element 초기화
      const messagesElement = document.getElementById("messages");
      const shouldScrollToBottom = messagesElement.scrollTop === messagesElement.scrollHeight - messagesElement.clientHeight;

      messagesElement.innerHTML = "";

      // (#9-5) messagesFromThisChatroom의 각 messgae 요소 렌더링
      messagesFromThisChatroom.forEach((message) => {
        const li = document.createElement("li");
        li.classList.add("message-item");
        if (message.senderId === memberId) {
          li.classList.add("mine");
        }
        li.innerHTML = `
                    <div class="message-content">
                      <img src="${message.senderProfileImg}" alt="Profile Image" width="30" height="30">
                      <div>
                        <p class="sender-name">${message.senderName}</p>
                        <p class="message-text">${message.message}</p>
                        <p class="message-time">${new Date(message.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  `;
        messagesElement.appendChild(li);
      });

      // Scroll to bottom if was already at bottom before fetching new messages or on initial load
      if (shouldScrollToBottom || messagesElement.children.length === 0) {
        messagesElement.scrollTop = messagesElement.scrollHeight;
      }

      // (#9-6) 채팅방 내부 헤더 렌더링
      const chatroomHeader = document.querySelector(".column.chatroom h2");

      // 상대 회원이 현재 온라인인 친구 목록에 있는지 여부를 따져서 상태 text 설정
      const isOnline = onlineFriendMemberIdList.includes(result.memberId);
      const statusText = isOnline ? "online" : "offline";

      // 상태 element에 class 부여
      const statusElement = document.createElement("span");
      statusElement.textContent = `(${statusText})`;
      statusElement.classList.add(isOnline ? "online" : "offline");

      // 헤더의 profile image, name, 상태 element 업데이트
      chatroomHeader.innerHTML = `<img src="${result.memberProfileImg}" alt="Profile Image" width="30" height="30" style="vertical-align: middle;">${result.gameName}`;
      chatroomHeader.appendChild(statusElement);

      // 채팅방 나가기 버튼 생성
      const exitButton = document.createElement("button");
      exitButton.textContent = "나가기";
      exitButton.style.marginLeft = "10px";

      // 채팅방 나가기 버튼 클릭 이벤트 리스너 추가
      exitButton.addEventListener("click", () => {
        exitChatroom(chatroomUuid);
      });

      // 헤더에 채팅방 나가기 버튼 추가
      chatroomHeader.appendChild(exitButton);

      // (#9-7) 채팅방 목록에 읽지 않은 메시지 개수를 0으로 업데이트
      const chatroomItem = document.querySelector(`.chatroom-item[data-chatroom-uuid="${chatroomUuid}"] p[data-new-count]`);
      if (chatroomItem) {
        chatroomItem.textContent = "0";
      } else {
        console.error(`Could not find chatroom item with UUID ${chatroomUuid} to update new count.`);
      }

      // (#9-8) 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 업데이트
      currentViewingChatroomUuid = chatroomUuid;
      currentChattingMemberId = result.memberId;
    }
  });
}

// 채팅 전송 폼 제출 시
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    const msg = input.value;
    // (#10-1) "chat-message" event emit
    socket.emit("chat-message", { uuid: currentViewingChatroomUuid, message: msg });
    input.value = "";
  }
});

// 알림 아이콘 클릭 시
document.getElementById("notificationButton").addEventListener("click", () => {
  const notificationList = document.getElementById("notificationList");
  notificationList.style.display = notificationList.style.display === "block" ? "none" : "block";
});

// 알림 창에서 탭 클릭 시
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", (e) => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));

    // 현재 클릭한 tab에 active 부여
    e.target.classList.add("active");
    const tabType = e.target.getAttribute("data-tab");

    // 모든 알림 type을 안보이게 변경 후, 현재 클릭한 tab만 보이게 변경
    document.querySelectorAll(".notification-type").forEach((nt) => (nt.style.display = "none"));
    document.getElementById(`${tabType}Notifications`).style.display = "block";
  });
});

// 알림 요소 추가
function addNotification(type, message, time, isRead) {
  const notificationContainer = document.getElementById(`${type}Notifications`);
  const div = document.createElement("div");
  div.className = `notification-item ${isRead ? "read" : "unread"}`;
  div.innerHTML = `
    <div class="notification-text">
      <p>${message}</p>
      <p class="notification-time">${time}</p>
    </div>
  `;
  notificationContainer.appendChild(div);
}

// 채팅방 퇴장 시
function exitChatroom(chatroomUuid) {
  console.log(`Exit chatroom with UUID: ${chatroomUuid}`);

  exitChatroomApi(chatroomUuid).then(() => {
    // chatroom 영역 초기화
    // 기존 메시지 element 초기화
    const messagesElement = document.getElementById("messages");
    messagesElement.innerHTML = "";

    // 채팅방 내부 헤더 초기화
    const chatroomHeader = document.querySelector(".column.chatroom h2");
    chatroomHeader.innerHTML = "채팅방";

    // 채팅방 목록 영역에서 해당 채팅방 삭제
    const chatroomItem = document.querySelector(`.chatroom-item[data-chatroom-uuid="${chatroomUuid}"]`);
    if (chatroomItem) {
      chatroomItem.remove();
    } else {
      console.log("chatroom delete not found: ", chatroomUuid);
    }

    // messagesFromThisChatroom array 초기화
    messagesFromThisChatroom = null;

    // hasNextChat 업데이트
    hasNextChat = null;

    // 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 초기화
    currentViewingChatroomUuid = null;
    currentChattingMemberId = null;
  });
}

// 채팅방 내부에서 스크롤이 가장 위에 닿았을 때
document.addEventListener("DOMContentLoaded", () => {
  const messagesElement = document.getElementById("messages");

  messagesElement.addEventListener("scroll", () => {
    if (messagesElement.scrollTop === 0) {
      // 스크롤이 끝까지 올라갔을 때
      if (hasNextChat) {
        // 더 조회해올 다음 chat 내역이 있다면
        fetchOlderMessages();
      } else {
        console.log("=== End of Chat Messages, No fecth ==");
      }
    }
  });
});

// timestamp cursor 기반으로 이전 메시지 내역 조회 api 호출
function fetchOlderMessages() {
  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    console.error("JWT token is missing.");
    return;
  }

  let firstMessage;
  // (#12-1) 가장 앞에 있는 메시지의 timestamp를 가져오기
  if (messagesFromThisChatroom.length > 0) {
    firstMessage = messagesFromThisChatroom[0];
  } else {
    console.log("messagesFromThisChatroom array is Empty");
  }

  // (#12-2) timestamp cursor를 담아 다음 메시지 조회 api 요청
  getMessageApi(currentViewingChatroomUuid, firstMessage.timestamp).then((result) => {
    if (result) {
      // (#12-3) 다음 메시지 조회 성공 응답 받음
      const olderMessages = result.chatMessageDtoList;

      // (#12-4) messagesFromThisChatroom array 맨 앞에 새로 조회해온 orderMessages 추가
      // olderMessages 배열을 messagesFromThisChatroom 배열의 맨 앞에 추가
      const updatedMessages = olderMessages.concat(messagesFromThisChatroom);
      messagesFromThisChatroom = updatedMessages;

      console.log("===================== fetxh OlderMessages, updated messagesFromThisChatroom ==================");
      console.log(messagesFromThisChatroom);

      //(#12-5) hasNextChat 업데이트
      hasNextChat = result.has_next;

      // (#12-6) 기존 메시지 목록 앞에 새로 불러온 메시지 추가 렌더링
      const messagesElement = document.getElementById("messages");
      const scrollPosition = messagesElement.scrollHeight; // 현재 스크롤 위치 저장

      olderMessages.reverse().forEach((message) => {
        const li = document.createElement("li");
        li.classList.add("message-item");
        if (message.senderId === memberId) {
          li.classList.add("mine");
        }
        li.innerHTML = `
                  <div class="message-content">
                    <img src="${message.senderProfileImg}" alt="Profile Image" width="30" height="30">
                    <div>
                      <p class="sender-name">${message.senderName}</p>
                      <p class="message-text">${message.message}</p>
                      <p class="message-time">${new Date(message.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                `;
        messagesElement.prepend(li);
      });

      // 기존 위치로 스크롤 이동 (새 메시지가 추가되었기 때문에 현재 위치를 유지하기 위해)
      messagesElement.scrollTop = messagesElement.scrollHeight - scrollPosition;
    }
  });
}
