import { exitChatroomApi, deleteFriendApi, sendFriendRequestApi, blockMemberApi } from "./api.js";

// 채팅방 입장/시작 API 응답으로 채팅방 영역 화면 렌더링 메소드
export function renderChatroomDiv(state, result) {
  // 기존 메시지 element 초기화
  const messagesElement = document.getElementById("messages");
  const shouldScrollToBottom = messagesElement.scrollTop === messagesElement.scrollHeight - messagesElement.clientHeight;

  messagesElement.innerHTML = "";

  // (#9-7),(#13-7),(#16-8)  API 응답의 chatMessageDtoList에 대해 각 messgae 요소 렌더링
  if (result.chatMessageListResponse) {
    result.chatMessageListResponse.chatMessageList.forEach((message) => {
      const li = document.createElement("li");
      li.classList.add("message-item");

      if (message.senderId === 0) {
        // 해당 메시지가 시스템 메시지인 경우

        li.classList.add("system-message");
        if (message.boardId) {
          li.setAttribute("data-board-id", message.boardId); // 특정 글로 이동해야 하는 경우, boardId 저장
          li.addEventListener("click", function () {
            // 클릭 시 alert 창 띄우기 (원래는 해당 boardId로 게시글 조회 API로 넘어가야 함)
            alert(`게시판 글 조회 페이지로 이동, board id: ${message.boardId}`);
          });
        }

        li.innerHTML = `
                    <div class="message-content" style = "cursor: pointer;">
                        <p class="message-text">${message.message}</p>
                    </div>
                  `;
      } else {
        // 시스템 메시지가 아닌 경우
        if (message.senderId === state.memberId) {
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
      }
      messagesElement.appendChild(li);
    });
  }

  // Scroll to bottom if was already at bottom before fetching new messages or on initial load
  if (shouldScrollToBottom || messagesElement.children.length === 0) {
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }

  // (#9-8),(#13-8),(#16-9) 채팅방 내부 헤더 렌더링
  const chatroomHeader = document.querySelector(".column.chatroom h2");

  // 헤더의 profile image, name 업데이트
  chatroomHeader.innerHTML = `<img src="${result.memberProfileImg}" alt="Profile Image" width="30" height="30" style="vertical-align: middle;">${result.gameName}`;

  // 상대 회원과 내가 친구 관계인 경우에만 상태 text 렌더링
  if (result.friend) {
    // 상대 회원이 현재 온라인인 친구 목록에 있는지 여부를 따져서 상태 text 설정
    const isOnline = state.onlineFriendMemberIdList.includes(result.memberId);
    const statusText = isOnline ? "online" : "offline";

    // 상태 element에 class 부여
    const statusElement = document.createElement("span");
    statusElement.textContent = `(${statusText})`;
    statusElement.classList.add(isOnline ? "online" : "offline");

    // 채팅방 헤더에 상태 element 추가
    chatroomHeader.appendChild(statusElement);
  }

  // (#9-9),(#13-9),(#16-10) 채팅방 내부 헤더 메뉴 버튼 생성
  createChatroomMenuButton(state, result.friend);

  // (#9-10),(#13-10),(#16-11) 채팅방 목록에 읽지 않은 메시지 개수를 0으로 업데이트
  const chatroomItem = document.querySelector(`.chatroom-item[data-chatroom-uuid="${result.uuid}"] p[data-new-count]`);
  if (chatroomItem) {
    chatroomItem.textContent = "0";
  } else {
    console.error(`Could not find chatroom item with UUID ${result.uuid} to update new count.`);
  }

  // (#9-11),(#13-11),(#16-12) 채팅 전송 폼 부분 렌더링
  // chat-form 부분 추출
  const chatForm = document.querySelector(".chat-form");
  const inputField = chatForm.querySelector("input");
  const sendButton = chatForm.querySelector("button");

  // 상대가 나를 차단한 경우, 채팅 전송 불가하도록 막기
  if (result.blocked) {
    // input 필드에 텍스트 설정
    inputField.value = "대화를 보낼 수 없는 상대입니다.";
    inputField.disabled = true; // 입력 필드 비활성화

    // 버튼 클릭(폼 전송) 불가 처리
    sendButton.disabled = true; // 버튼 비활성화
  } else {
    // input 필드에 텍스트 초기화
    inputField.value = "";
    inputField.disabled = false; // 입력 필드 활성화

    // 버튼 클릭(폼 전송) 가능 처리
    sendButton.disabled = false; // 버튼 활성화
  }
}

// 채팅방 내부 메뉴 버튼 생성
function createChatroomMenuButton(state, isFriend) {
  const chatroomHeader = document.querySelector(".column.chatroom h2");

  // 메뉴 버튼 생성
  const menuButton = document.createElement("button");
  menuButton.textContent = "⋮";
  menuButton.id = "menuButton"; // 버튼에 ID 추가

  // 팝업 메뉴 생성
  const popupMenu = document.createElement("div");
  popupMenu.id = "popupMenu";
  popupMenu.className = "popup-menu";

  // 팝업 메뉴 항목 생성
  //const menuItems = ["채팅방 나가기", "친구 추가", "차단하기", "신고하기", "매너 평가", "비매너 평가"];
  const ul = document.createElement("ul");

  popupMenu.appendChild(ul);

  // 채팅방 나가기 메뉴 생성
  createMenuItem(ul, "채팅방 나가기", () => {
    // 8080서버에 채팅방 나가기 API 요청
    exitChatroom(state, state.currentViewingChatroomUuid);
  });

  if (isFriend) {
    // 친구 삭제 메뉴 생성
    createMenuItem(ul, "친구 삭제", () => {
      // 8080서버에 친구 삭제 API 요청
      deleteFriendApi(state.currentChattingMemberId).then(() => {
        // 친구 목록 영역 새로고침
        const fetchFriendsButton = document.getElementById("fetchFriendsButton");
        fetchFriendsButton.click(); // 버튼 클릭 이벤트 발생

        // 채팅방 헤더에 상태 element 제거
        const chatroomHeaderSpan = document.querySelector(".column.chatroom h2 span");
        if (chatroomHeaderSpan) {
          chatroomHeaderSpan.textContent = ""; // span 내부 텍스트 초기화
        }
      });
    });
  } else {
    // 친구 추가 메뉴 생성
    createMenuItem(ul, "친구 추가", () => {
      // 8080서버에 친구 요청 전송 API 요청
      sendFriendRequestApi(state.currentChattingMemberId).then((result) => {
        alert(result.result);
      });
    });
  }

  // 차단하기 메뉴 생성
  createMenuItem(ul, "차단하기", () => {
    // 차단 팝업 띄우기
    // 팝업 요소 선택
    const blockPopup = document.getElementById("blockPopup");
    const confirmButton = document.getElementById("confirmBlock");
    const cancelButton = document.getElementById("cancelBlock");

    blockPopup.style.display = "block";

    // "예" 버튼 클릭 시 실제 이벤트 발생
    confirmButton.addEventListener("click", () => {
      // (#15-1) 8080서버에 회원 차단 API 요청
      blockMemberApi(state.currentChattingMemberId).then((result) => {
        // (#15-2) 회원 차단 API 정상 응답 받음
        blockPopup.style.display = "none"; // 팝업 창 닫기
        alert(result);

        // (#15-3) socket 서버에 exit-chatroom event emit
        socket.emit("exit-chatroom", { uuid: state.currentViewingChatroomUuid });

        // (#15-5) 채팅방 영역 초기화
        resetChatroomDiv(state, state.currentViewingChatroomUuid);
      });
      blockPopup.style.display = "none"; // 팝업 창 닫기
    });

    cancelButton.addEventListener("click", () => {
      blockPopup.style.display = "none"; // 팝업 창 닫기
    });
  });

  // 신고하기 메뉴 생성
  createMenuItem(ul, "신고하기", () => {
    // 회원 신고 API 연결
  });

  // 매너 평가 메뉴 생성
  createMenuItem(ul, "매너 평가", () => {
    // 매너 평가 API 연결
  });

  // 비매너 평가 메뉴 생성
  createMenuItem(ul, "비매너 평가", () => {
    // 비매너 평가 API 연결
  });

  // 채팅방 메뉴 버튼 클릭 시
  menuButton.addEventListener("click", () => {
    const isVisible = popupMenu.style.display === "block";
    popupMenu.style.display = isVisible ? "none" : "block";
  });

  // 팝업 메뉴 외부를 클릭했을 때 닫히도록 설정
  document.addEventListener("click", (event) => {
    if (event.target !== menuButton && !popupMenu.contains(event.target)) {
      popupMenu.style.display = "none";
    }
  });

  // 헤더에 채팅방 메뉴 버튼 및 팝업 메뉴 추가
  chatroomHeader.appendChild(menuButton);
  chatroomHeader.appendChild(popupMenu);
}

// 채팅방 퇴장 시
function exitChatroom(state, chatroomUuid) {
  console.log(`Exit chatroom with UUID: ${chatroomUuid}`);

  // (#14-1) 8080서버에 채팅방 나가기 API 요청
  exitChatroomApi(chatroomUuid).then(() => {
    // (#14-2) 채팅방 나가기 API 정상 응답 받음
    // (#14-3) socket 서버에 exit-chatroom event emit
    socket.emit("exit-chatroom", { uuid: state.currentViewingChatroomUuid });

    // (#14-5) 채팅방 영역 초기화
    resetChatroomDiv(state, chatroomUuid);
  });
}

// 메뉴 아이템 생성 메소드
function createMenuItem(ulElement, text, onClick) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.className = "menu-item";
  button.textContent = text;

  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#f1f1f1";
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "transparent";
  });

  // 버튼 클릭 시 동작 연결
  button.addEventListener("click", onClick);

  li.appendChild(button);
  ulElement.appendChild(li);
}

// 채팅방 영역 화면 초기화
function resetChatroomDiv(state, chatroomUuid) {
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
  state.messagesFromThisChatroom = null;

  // 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 초기화
  state.currentViewingChatroomUuid = null;
  state.currentChattingMemberId = null;

  // systemFlag 초기화
  state.currentSystemFlag = null;
}
