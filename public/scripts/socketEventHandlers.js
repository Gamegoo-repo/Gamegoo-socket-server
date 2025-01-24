import { getChatroomListApi, readChatApi, reissueToken } from "./api.js";
import { renderChatroomDiv } from "./module.js";

// connection-jwt-error handler
export async function handleConnectionJwtError(socket, state) {
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
}

// jwt-expired-error handler
export async function handleJwtExpiredError(socket, state, data) {
  const eventName = data.data.eventName;
  const eventData = data.data.eventData;
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
}

// member-info handler
export function handleMemberInfo(state, data) {
  const loginStatus = document.getElementById("loginStatus");
  loginStatus.textContent = "You are Login User, member Id: " + data.data.memberId;

  // (#1-8),(#2-4) memberId 전역변수 초기화
  state.memberId = data.data.memberId;
}

// init-online-friend-list handler
export function handleInitOnlineFriendList(state, data) {
  // (#1-18),(#2-13) 현재 온라인인 친구 목록 초기화
  state.onlineFriendMemberIdList = data.data.onlineFriendMemberIdList;

  console.log("init-online-friend-list event에 대한 listener가 작동합니다.");
  console.log("Online Friend Member ID List:", state.onlineFriendMemberIdList);
}

// friend-online handler
export function handleFriendOnline(state, data) {
  const memberId = data.data.memberId;
  // (#4-2) 친구 목록의 온라인 여부 html 변경
  const li = document.querySelector(`li[data-member-id='${memberId}']`);

  if (li) {
    const statusElement = li.querySelector("span.offline");
    if (statusElement) {
      statusElement.textContent = "(online)";
      statusElement.classList.remove("offline");
      statusElement.classList.add("online");
    }
  }

  // (#4-3) 현재 온라인인 친구 목록 업데이트
  state.onlineFriendMemberIdList.push(memberId);
  console.log("current online Friend Member Id List:", state.onlineFriendMemberIdList);

  // (#4-4) 현재 채팅 중인 (채팅창을 보고있는) memberId와 동일한 경우 상태 텍스트 변경
  console.log("friend-online listener: currentChattingMemberId is.. ", state.currentChattingMemberId);
  if (state.currentChattingMemberId === memberId) {
    const chatroomHeader = document.querySelector(".column.chatroom h2");
    const statusElement = chatroomHeader.querySelector("span");
    if (statusElement) {
      statusElement.textContent = "(online)";
      statusElement.classList.remove("offline");
      statusElement.classList.add("online");
    }
  }
}

// friend-offline handler
export function handleFriendOffline(state, data) {
  const memberId = data.data.memberId;
  // (#5-2) 친구 목록의 온라인 여부 html 변경
  const li = document.querySelector(`li[data-member-id='${memberId}']`);

  if (li) {
    const statusElement = li.querySelector("span.online");
    if (statusElement) {
      statusElement.textContent = "(offline)";
      statusElement.classList.remove("online");
      statusElement.classList.add("offline");
    }
  }

  // (#5-3) onlineFriendMemberIdList에서 해당 memberId 제거
  state.onlineFriendMemberIdList = state.onlineFriendMemberIdList.filter((id) => id !== memberId);

  console.log(`Friend ID: ${memberId} is offline`);
  console.log("Updated online Friend Member Id List:", state.onlineFriendMemberIdList);

  // (#5-4) 현재 채팅 중인 memberId와 동일한 경우 상태 텍스트 변경
  if (state.currentChattingMemberId === memberId) {
    const chatroomHeader = document.querySelector(".column.chatroom h2");
    const statusElement = chatroomHeader.querySelector("span");
    if (statusElement) {
      statusElement.textContent = "(offline)";
      statusElement.classList.remove("online");
      statusElement.classList.add("offline");
    }
  }
}

// my-message-broadcast-success handler
export function handleMyMessageBroadcastSuccess(state, data) {
  // (#10-13) messagesFromThisChatroom array 업데이트
  const { chatroomUuid, ...newMessage } = data.data;

  state.messagesFromThisChatroom.push(newMessage);

  console.log("============== messagesFromThisChatroom Updated ==============");
  console.log(state.messagesFromThisChatroom);

  // (#10-14) 내가 보낸 메시지 요소 생성
  const messagesElement = document.getElementById("messages");
  const li = document.createElement("li");
  li.classList.add("message-item");
  li.classList.add("mine");
  li.innerHTML = `
                                              <div class="message-content">
                                                <img src="${data.data.senderProfileImg}" alt="Profile Image" width="30" height="30">
                                                <div>
                                                  <p class="sender-name">${data.data.senderName}</p>
                                                  <p class="message-text">${data.data.message}</p>
                                                  <p class="message-time">${new Date(data.data.createdAt).toLocaleString()}</p>
                                                </div>
                                              </div>
                                            `;
  messagesElement.appendChild(li);

  // (#10-15) 채팅방 목록 내 element 업데이트
  // 채팅방 목록 내의 마지막 전송시각 업데이트
  const chatroomItemLastTime = document.querySelector(`.chatroom-item[data-chatroom-uuid="${state.currentViewingChatroomUuid}"] p[last-msg-time]`);
  if (chatroomItemLastTime) {
    chatroomItemLastTime.textContent = `${new Date(data.data.createdAt).toLocaleString()}`;
  }

  // 채팅방 목록 내의 마지막 메시지 업데이트
  const chatroomItemLastMsg = document.querySelector(`.chatroom-item[data-chatroom-uuid="${state.currentViewingChatroomUuid}"] p[last-msg-text]`);
  if (chatroomItemLastMsg) {
    chatroomItemLastMsg.textContent = data.data.message;
  }

  // 채팅방 목록 내 li 요소 재정렬
  reorderChatroomsByLastMsgTime();
}

// chat-message handler
export function handleChatMessage(state, data) {
  // 메시지가 온 채팅방이 현재 보고있는 채팅방인 경우
  if (data.data.chatroomUuid === state.currentViewingChatroomUuid) {
    // (#11-2) messagesFromThisChatroom array 업데이트
    const { chatroomUuid, ...newMessage } = data.data;

    state.messagesFromThisChatroom.push(newMessage);

    console.log("============== messagesFromThisChatroom Updated ==============");
    console.log(state.messagesFromThisChatroom);

    // (#11-3) 채팅 메시지 요소 동적 생성
    const messagesElement = document.getElementById("messages");
    const li = document.createElement("li");
    li.classList.add("message-item");
    if (data.data.senderId === state.memberId) {
      li.classList.add("mine");
    }
    li.innerHTML = `
                                              <div class="message-content">
                                                <img src="${data.data.senderProfileImg}" alt="Profile Image" width="30" height="30">
                                                <div>
                                                  <p class="sender-name">${data.data.senderName}</p>
                                                  <p class="message-text">${data.data.message}</p>
                                                  <p class="message-time">${new Date(data.data.createdAt).toLocaleString()}</p>
                                                </div>
                                              </div>
                                            `;
    messagesElement.appendChild(li);

    // (#11-4) 8080에게 해당 채팅 메시지를 읽었음 요청 전송
    readChatApi(state.currentViewingChatroomUuid, data.data.timestamp);
  } else {
    // 내가 보고있는 채팅방에서 온 메시지가 아닌 경우
    // (#11-6) 해당 메시지의 전송자가 내가 아닌 경우에만 채팅방 목록 내의 읽지 않은 메시지 개수 업데이트
    if (data.data.senderId != state.memberId) {
      const chatroomItemNewCnt = document.querySelector(`.chatroom-item[data-chatroom-uuid="${data.data.chatroomUuid}"] p[data-new-count]`);
      if (chatroomItemNewCnt) {
        // 현재 텍스트 내용을 숫자로 변환하여 1 증가시킨 후 다시 설정
        const currentCount = parseInt(chatroomItemNewCnt.textContent);
        chatroomItemNewCnt.textContent = `${currentCount + 1}`;
      } else {
        console.error(`Could not find chatroom item with UUID ${data.data.chatroomUuid} to update new message count.`);
      }
    }
  }

  // (#11-7) 채팅방 목록 element 업데이트
  // 채팅방 목록 내의 마지막 전송시각 업데이트
  const chatroomItemLastTime = document.querySelector(`.chatroom-item[data-chatroom-uuid="${data.data.chatroomUuid}"] p[last-msg-time]`);
  if (chatroomItemLastTime) {
    chatroomItemLastTime.textContent = `${new Date(data.data.createdAt).toLocaleString()}`;
  } else {
    console.error(`Could not find chatroom item with UUID ${data.data.chatroomUuid} to update last msg time.`);
  }

  // 채팅방 목록 내의 마지막 메시지 업데이트
  const chatroomItemLastMsg = document.querySelector(`.chatroom-item[data-chatroom-uuid="${data.data.chatroomUuid}"] p[last-msg-text]`);
  if (chatroomItemLastMsg) {
    chatroomItemLastMsg.textContent = data.data.message;
  } else {
    console.error(`Could not find chatroom item with UUID ${data.data.chatroomUuid} to update last msg text.`);
  }
  // 채팅방 목록 li 요소 재정렬
  reorderChatroomsByLastMsgTime();
}

// joined-new-chatroom handler
export async function handleJoinedNewChatroom() {
  try {
    // (#10-9) 채팅방 목록 다시 요청 후 업데이트
    // 채팅방 목록 조회 api 요청
    const result = await getChatroomListApi();

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
  } catch (error) {
    console.log("Error during handleJoinedNewChatroom:", error.message);
  }
}

// chat-system-message handler
export async function handleChatSystemMessage(state, data) {
  const { chatroomUuid, ...newMessage } = data.data;
  console.log("===================== chat-system-message EVENT LISTEN  ===================== ");
  console.log("chatroomUuid: ", chatroomUuid, ", currentViewingChatroomUuid: ", state.currentViewingChatroomUuid);

  // 현재 보고 있는 채팅방에서 온 시스템 메시지인 경우
  if (chatroomUuid === state.currentViewingChatroomUuid) {
    state.messagesFromThisChatroom.push(newMessage);

    console.log("============== messagesFromThisChatroom Updated ==============");
    console.log(state.messagesFromThisChatroom);

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
}

// manner-system-message handler
export function handleMannerSystemMessage(state, data) {
  const { chatroomUuid, ...newMessage } = data.data;

  // 현재 보고 있는 채팅방에서 온 시스템 메시지인 경우
  if (chatroomUuid === state.currentViewingChatroomUuid) {
    state.messagesFromThisChatroom.push(newMessage);

    console.log("============== messagesFromThisChatroom Updated ==============");
    console.log(state.messagesFromThisChatroom);

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
}

// test-matching-chatting-success handler
export async function handleTestMatchingChattingSuccess(state, data) {
  const chatroomUuid = data.data.chatroomUuid;

  // 채팅방 입장 API 정상 응답 받음
  const enterChatroomResponse = enterChatroomApi(chatroomUuid);

  // messagesFromThisChatroom array 초기화
  state.messagesFromThisChatroom = enterChatroomResponse.chatMessageList.chatMessageDtoList;

  console.log("============== fetch chat messages result ===============");
  console.log(enterChatroomResponse.chatMessageList.chatMessageDtoList);

  // systemFlag update, 기존에 보던 채팅방과 다른 방에 입장한 경우에만
  if (state.currentViewingChatroomUuid != chatroomUuid) {
    currentSystemFlag = null; // uuid를 통한 채팅방 입장 시 systemFlag 값 없음
  }

  // 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 업데이트
  state.currentViewingChatroomUuid = chatroomUuid;
  state.currentChattingMemberId = enterChatroomResponse.memberId;

  // 채팅방 영역 렌더링 메소드 호출
  renderChatroomDiv(state, enterChatroomResponse);

  // 채팅방 목록 조회 api 요청
  const chatroomListResponse = await getChatroomListApi();
  // 채팅방 목록 element 초기화
  const chatroomListElement = document.getElementById("chatroomList");
  chatroomListElement.innerHTML = "";

  // 채팅방 목록 렌더링
  // api result data를 돌면서 html 요소 생성
  chatroomListResponse.forEach((chatroom) => {
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
