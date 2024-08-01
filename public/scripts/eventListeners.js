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

      // (#9-8) 채팅방 내부 헤더 렌더링
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

      // (#9-9) 채팅방 목록에 읽지 않은 메시지 개수를 0으로 업데이트
      const chatroomItem = document.querySelector(`.chatroom-item[data-chatroom-uuid="${chatroomUuid}"] p[data-new-count]`);
      if (chatroomItem) {
        chatroomItem.textContent = "0";
      } else {
        console.error(`Could not find chatroom item with UUID ${chatroomUuid} to update new count.`);
      }

      // (#9-10) 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 업데이트
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
