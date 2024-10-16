let socket;
let memberId = null; // 이 사용자의 memberId 저장
let onlineFriendMemberIdList = []; // 현재 온라인인 친구의 memberId 저장
let currentChattingMemberId = null; // 현재 이 사용자가 보고 있는 채팅방의 상대 memberId 저장
let currentViewingChatroomUuid = null; // 현재 이 사용자가 보고 있는 채팅방의 uuid 저장
let messagesFromThisChatroom = []; // 현재 보고 있는 채팅방의 메시지 목록
let hasNextChat = false; // 채팅 내역 조회를 위해, 다음 채팅내역이 존재하는지 여부 저장
let hasNextFriend = false; // 친구 목록 조회를 위해, 다음 친구 목록이 존재하는지 여부 저장
let hasNextChatroom = false; // 채팅방 목록 조회를 위해, 다음 채팅방 목록이 존재하는지 여부 저장
let nextFriendCursor = null; // 다음 친구 목록 조회를 위한 커서
let nextChatroomCursor = null; // 다음 채팅방 목록 조회를 위한 커서
let currentSystemFlag = null; // 현재 채팅방에서 메시지 전송 시 보내야할 systemFlag 저장

const loginStatus = document.getElementById("loginStatus");

function connectSocket(jwtToken = null) {
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
    console.log("Connected to server. Socket ID:", socket.id);
    alert("Connected to server. Socket ID: " + socket.id);
  });

  setupSocketListeners();
  setUpMatchingSocketListeners();
}

function setupSocketListeners() {
  // connection-jwt-error event listener
  socket.on("connection-jwt-error", async () => {
    console.log("connection-jwt-error occured");
    try {
      const result = await reissueToken(); // 토큰 재발급
      console.log("reissueToken result:", result);
      localStorage.setItem("jwtToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);
      console.log("reissue token success");
      socket.emit("connection-update-token", { token: result.accessToken });
    } catch (error) {
      console.error("Failed to reissue token: ", error);
    }
  });

  socket.on("jwt-expired-error", async (response) => {
    const eventName = response.data.eventName;
    const eventData = response.data.eventData;
    console.log("jwt-expired-error occured");
    console.log(`eventName:${eventName}, eventData:${eventData}`);
    try {
      const result = await reissueToken(); // 토큰 재발급
      console.log("reissueToken result:", result);
      localStorage.setItem("jwtToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);
      console.log("reissue token success");
      socket.emit(eventName, { ...eventData, token: result.accessToken }); // eventData에다가 token만 추가해서 다시 emit
    } catch (error) {
      console.error("Failed to reissue token: ", error);
    }
  });

  // // 재연결 시도 중
  // socket.on("reconnect_attempt", (attempt) => {
  //   console.log("Reconnect attempt:", attempt);
  // });

  // // 재연결 성공
  // socket.on("reconnect", (attempt) => {
  //   console.log("Reconnected successfully after", attempt, "attempt(s)");
  // });

  // // 재연결 실패
  // socket.on("reconnect_failed", () => {
  //   console.log("Reconnection failed after maximum attempts");
  // });

  // // 연결 에러 발생
  // socket.on("connect_error", (error) => {
  //   console.error("Connection error1234:", error);
  // });

  // member-info event listener
  socket.on("member-info", (response) => {
    loginStatus.textContent = "You are Login User, member Id: " + response.data.memberId;

    // (#1-8),(#2-4) memberId 전역변수 초기화
    memberId = response.data.memberId;
  });

  // init-online-friend-list event listener
  socket.on("init-online-friend-list", (response) => {
    // (#1-18),(#2-13) 현재 온라인인 친구 목록 초기화
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
    // (#10-13) messagesFromThisChatroom array 업데이트
    const { chatroomUuid, ...newMessage } = response.data;

    messagesFromThisChatroom.push(newMessage);

    console.log("============== messagesFromThisChatroom Updated ==============");
    console.log(messagesFromThisChatroom);

    // (#10-14) 내가 보낸 메시지 요소 생성
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

    // (#10-15) 채팅방 목록 내 element 업데이트
    // 채팅방 목록 내의 마지막 전송시각 업데이트
    const chatroomItemLastTime = document.querySelector(`.chatroom-item[data-chatroom-uuid="${currentViewingChatroomUuid}"] p[last-msg-time]`);
    if (chatroomItemLastTime) {
      chatroomItemLastTime.textContent = `${new Date(response.data.createdAt).toLocaleString()}`;
    }

    // 채팅방 목록 내의 마지막 메시지 업데이트
    const chatroomItemLastMsg = document.querySelector(`.chatroom-item[data-chatroom-uuid="${currentViewingChatroomUuid}"] p[last-msg-text]`);
    if (chatroomItemLastMsg) {
      chatroomItemLastMsg.textContent = response.data.message;
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

  // joined-new-chatroom event listener
  socket.on("joined-new-chatroom", () => {
    // (#10-9) 채팅방 목록 다시 요청 후 업데이트
    // 채팅방 목록 조회 api 요청
    getChatroomListApi().then((result) => {
      if (result) {
        // 채팅방 목록 조회 성공 응답 받음
        // 채팅방 목록 element 초기화
        const chatroomListElement = document.getElementById("chatroomList");
        chatroomListElement.innerHTML = "";

        // 채팅방 목록 렌더링
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

  socket.on("chat-system-message", (response) => {
    const { chatroomUuid, ...newMessage } = response.data;
    console.log("===================== chat-system-message EVENT LISTEN  ===================== ");
    console.log("chatroomUuid: ", chatroomUuid, ", currentViewingChatroomUuid: ", currentViewingChatroomUuid);

    // 현재 보고 있는 채팅방에서 온 시스템 메시지인 경우
    if (chatroomUuid === currentViewingChatroomUuid) {
      messagesFromThisChatroom.push(newMessage);

      console.log("============== messagesFromThisChatroom Updated ==============");
      console.log(messagesFromThisChatroom);

      // 시스템 메시지 요소 동적 생성
      const messagesElement = document.getElementById("messages");
      const li = document.createElement("li");
      li.classList.add("message-item");
      li.classList.add("system-message");
      if (newMessage.boardId) {
        li.setAttribute("data-board-id", newMessage.boardId); // 특정 글로 이동해야 하는 경우, boardId 저장
        li.addEventListener("click", function () {
          // 클릭 시 alert 창 띄우기 (원래는 해당 boardId로 게시글 조회 API로 넘어가야 함)
          alert(`게시판 글 조회 페이지로 이동, board id: ${newMessage.boardId}`);
        });
      }

      li.innerHTML = `
                    <div class="message-content" style = "cursor: pointer;">
                        <p class="message-text">${newMessage.message}</p>
                    </div>
                  `;
      messagesElement.appendChild(li);
    }
  });
  socket.on("manner-system-message", (response) => {
    const { chatroomUuid, ...newMessage } = response.data;

    // 현재 보고 있는 채팅방에서 온 시스템 메시지인 경우
    if (chatroomUuid === currentViewingChatroomUuid) {
      messagesFromThisChatroom.push(newMessage);

      console.log("============== messagesFromThisChatroom Updated ==============");
      console.log(messagesFromThisChatroom);

      // 시스템 메시지 요소 동적 생성
      const messagesElement = document.getElementById("messages");
      const li = document.createElement("li");
      li.classList.add("message-item");
      li.classList.add("system-message");

      li.innerHTML = `
                    <div class="message-content" style = "cursor: pointer;">
                        <p class="message-text">${newMessage.message}</p>
                    </div>
                  `;
      messagesElement.appendChild(li);
    }
  });

  socket.on("test-matching-chatting-success", (response) => {
    response.data.chatroomUuid;
    enterChatroomApi(response.data.chatroomUuid).then((result) => {
      if (result) {
        // 채팅방 입장 API 정상 응답 받음

        // messagesFromThisChatroom array 초기화
        messagesFromThisChatroom = result.chatMessageList.chatMessageDtoList;

        console.log("============== fetch chat messages result ===============");
        console.log(result.chatMessageList.chatMessageDtoList);

        // hasNextChat 업데이트
        hasNextChat = result.chatMessageList.has_next;

        // systemFlag update, 기존에 보던 채팅방과 다른 방에 입장한 경우에만
        if (currentViewingChatroomUuid != response.data.chatroomUuid) {
          currentSystemFlag = null; // uuid를 통한 채팅방 입장 시 systemFlag 값 없음
        }

        // 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 업데이트
        currentViewingChatroomUuid = response.data.chatroomUuid;
        currentChattingMemberId = result.memberId;

        // 채팅방 영역 렌더링 메소드 호출
        renderChatroomDiv(result);

        // 채팅방 목록 조회 api 요청
        getChatroomListApi().then((result) => {
          if (result) {
            // 채팅방 목록 조회 성공 응답 받음
            // 채팅방 목록 element 초기화
            const chatroomListElement = document.getElementById("chatroomList");
            chatroomListElement.innerHTML = "";

            // 채팅방 목록 렌더링
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
      }
    });
  });
}

// 화면 새로 로드 시 socket 다시 연결
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
