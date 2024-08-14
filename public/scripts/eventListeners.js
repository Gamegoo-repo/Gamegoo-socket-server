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

      // (#1-5) 3000서버로 login api 요청 (소켓 초기화를 위함)
      loginNodeApi();
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

        // 사용자 정보를 담는 div 생성
        const userInfoDiv = document.createElement("div");
        userInfoDiv.className = "user-info"; // CSS 클래스 추가
        userInfoDiv.innerHTML = `
                <img src="${friend.memberProfileImg}" alt="${friend.name}'s profile picture" width="30" height="30">
                <span>${friend.name}</span>
            `;
        li.appendChild(userInfoDiv);
        li.appendChild(statusElement);

        // 즐겨찾기 여부 표시
        // 별 아이콘 추가
        const star = document.createElement("span");
        star.className = "star";
        star.innerHTML = "☆";

        // liked가 true인 경우 보라색으로 설정
        if (friend.liked) {
          star.classList.add("liked");
        }

        // li 요소에 별 아이콘 추가
        li.appendChild(star);

        // 해당 친구 부분 클릭 시, 친구와의 채팅방 시작 api 요청
        userInfoDiv.addEventListener("click", () => {
          // (#13-1) 채팅방 시작 API 요청
          startChatByMemberIdApi(friend.memberId).then((result) => {
            // (#13-2) 채팅방 시작 API 정상 응답 받음
            // (#13-3) messagesFromThisChatroom array 초기화
            messagesFromThisChatroom = result.chatMessageList.chatMessageDtoList;

            console.log("============== fetch chat messages result ===============");
            console.log(result.chatMessageList.chatMessageDtoList);

            // (#13-4) hasNextChat 업데이트
            hasNextChat = result.chatMessageList.has_next;

            // (#13-5) 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 업데이트
            currentViewingChatroomUuid = result.uuid;
            currentChattingMemberId = result.memberId;

            // (#13-6) systemFlag 초기화, 특정 회원과의 채팅방 시작 시 systemFlag는 항상 null임
            currentSystemFlag = null;

            renderChatroomDiv(result);
          });
        });

        // 별 아이콘 클릭 시, 해당 친구 즐겨찾기 설정/해제 요청 전송
        star.addEventListener("click", () => {
          // liked 클래스가 있는지 확인
          if (star.classList.contains("liked")) {
            // 즐겨찾기 해제 api 요청
            unstarFriendApi(friend.memberId).then((result) => {
              // liked 상태 변경
              star.classList.remove("liked");
              console.log("즐겨찾기 해제 성공, memberId: ", friend.memberId);
            });
          } else {
            // 즐겨찾기 설정 api 요청
            starFriendApi(friend.memberId).then((result) => {
              // liked 상태 변경
              star.classList.add("liked");
              console.log("즐겨찾기 설정 성공, memberId: ", friend.memberId);
            });
          }
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

  // (#9-1) 채팅방 입장 API 요청
  enterChatroomApi(chatroomUuid).then((result) => {
    if (result) {
      // (#9-2) 채팅방 입장 API 정상 응답 받음

      // (#9-3) messagesFromThisChatroom array 초기화
      messagesFromThisChatroom = result.chatMessageList.chatMessageDtoList;

      console.log("============== fetch chat messages result ===============");
      console.log(result.chatMessageList.chatMessageDtoList);

      // (#9-4) hasNextChat 업데이트
      hasNextChat = result.chatMessageList.has_next;

      // (#9-5) 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 업데이트
      currentViewingChatroomUuid = chatroomUuid;
      currentChattingMemberId = result.memberId;

      // (#9-6) systemFlag 업데이트
      // systemFlag update, 기존에 보던 채팅방과 다른 방에 입장한 경우에만
      if (currentViewingChatroomUuid != chatroomUuid) {
        currentSystemFlag = null; // uuid를 통한 채팅방 입장 시 systemFlag 값 없음
      }

      // 채팅방 영역 렌더링 메소드 호출
      renderChatroomDiv(result);
    }
  });
}

// 채팅방 내부에서 스크롤이 가장 위에 닿았을 때
document.addEventListener("DOMContentLoaded", () => {
  const messagesElement = document.getElementById("messages");

  messagesElement.addEventListener("scroll", () => {
    // 스크롤이 끝까지 올라갔을 때
    if (messagesElement.scrollTop === 0) {
      // 더 조회해올 다음 chat 내역이 있다면
      if (hasNextChat) {
        fetchOlderMessages();
      } else {
        console.log("=== End of Chat Messages, No fecth ==");
      }
    }
  });
});

// timestamp cursor 기반으로 이전 메시지 내역 조회 api 호출 및 렌더링
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
        }
        messagesElement.prepend(li);
      });

      // 기존 위치로 스크롤 이동 (새 메시지가 추가되었기 때문에 현재 위치를 유지하기 위해)
      messagesElement.scrollTop = messagesElement.scrollHeight - scrollPosition;
    }
  });
}

// 채팅 전송 폼 제출 시
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    const msg = input.value;
    console.log("CHAT-MESSAGE EVENT EMIT ====== currentSystemFlag: ", currentSystemFlag);
    if (currentSystemFlag) {
      // 보내야 할 systemFlag가 있는 경우
      // (#10-2) "chat-message" event emit
      socket.emit("chat-message", { uuid: currentViewingChatroomUuid, message: msg, system: currentSystemFlag });

      // systemFlag 초기화
      currentSystemFlag = null;
    } else {
      // (#10-1) "chat-message" event emit
      socket.emit("chat-message", { uuid: currentViewingChatroomUuid, message: msg });
    }
    input.value = "";
  }
});

// 알림 아이콘 클릭 시
document.getElementById("notificationButton").addEventListener("click", () => {
  const notificationList = document.getElementById("notificationList");
  notificationList.style.display = notificationList.style.display === "block" ? "none" : "block";
});

// 알림 닫기 버튼 클릭 시
document.getElementById("notiCloseButton").addEventListener("click", function () {
  document.getElementById("notificationList").style.display = "none";
});

// 알림 창에서 특정 탭 클릭 시
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

// 알림 요소 추가 메소드
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

// 게시판 말걸어보기 테스트 버튼 클릭 시
document.getElementById("boardTestButton").addEventListener("click", () => {
  document.getElementById("boardIdPopup").style.display = "block";
});

// 게시판 말걸어보기 팝업 닫기 버튼 클릭 시
document.getElementById("closeBoardIdPopupButton").addEventListener("click", () => {
  document.getElementById("boardIdPopup").style.display = "none";
});

// 게시판 말걸어보기 팝업 제출 버튼 클릭 시
// 게시글을 통한 채팅방 시작
document.getElementById("boardIdForm").addEventListener("submit", (event) => {
  event.preventDefault(); // 기본 제출 동작 방지
  document.getElementById("boardIdPopup").style.display = "none";

  const boardId = document.getElementById("boardIdInput").value;
  // (#16-1) 특정 글을 통한 채팅방 시작 API 요청
  startChatByBoardIdApi(boardId).then((result) => {
    // (#16-2) 채팅방 시작 API 정상 응답 받음
    // (#16-3) messagesFromThisChatroom array 초기화
    messagesFromThisChatroom = result.chatMessageList.chatMessageDtoList;

    // (#16-4) messagesFromThisChatroom 맨 뒤에 시스템 메시지 임의로 추가 (프론트 화면에서 보여지기 위함)
    if (result.system.flag === 1) {
      const systemMessage = {
        senderId: 0,
        senderName: "SYSTEM",
        senderProfileImg: 0,
        message: "상대방이 게시한 글을 보고 말을 걸었어요. 대화를 시작해보세요~",
        createdAt: null,
        timestamp: null,
        boardId: result.system.boardId,
      };
      messagesFromThisChatroom.push(systemMessage);
    } else {
      const systemMessage = {
        senderId: 0,
        senderName: "SYSTEM",
        senderProfileImg: 0,
        message: "상대방이 게시한 글을 보고 말을 걸었어요.",
        createdAt: null,
        timestamp: null,
        boardId: result.system.boardId,
      };
      messagesFromThisChatroom.push(systemMessage);
    }

    console.log("============== fetch chat messages result ===============");
    console.log(result.chatMessageList.chatMessageDtoList);

    // (#16-5) hasNextChat 업데이트
    hasNextChat = result.chatMessageList.has_next;

    // (#16-6) 현재 보고 있는 채팅방 uuid, 채팅 중인 memberId 업데이트
    currentViewingChatroomUuid = result.uuid;
    currentChattingMemberId = result.memberId;

    // (#16-7) systemFlag 초기화
    currentSystemFlag = result.system;
    console.log("currentSystemFlag: ", currentSystemFlag);

    renderChatroomDiv(result);
  });
});

// 매칭 채팅방 입장 테스트 버튼 클릭 시
document.getElementById("matchingTestButton").addEventListener("click", () => {
  document.getElementById("matchingMemberIdPopup").style.display = "block";
});

// 매칭 채팅방 입장 팝업 닫기 버튼 클릭 시
document.getElementById("closeMatchingMemberIdPopupButton").addEventListener("click", () => {
  document.getElementById("matchingMemberIdPopup").style.display = "none";
});

// 매칭 채팅방 입장 팝업 제출 버튼 클릭 시
// 매칭을 통한 채팅방 시작
document.getElementById("mathingMemberIdForm").addEventListener("submit", (event) => {
  event.preventDefault(); // 기본 제출 동작 방지
  document.getElementById("matchingMemberIdPopup").style.display = "none";

  const matchingMemberId = document.getElementById("mathingMemberIdInput").value;
  socket.emit("test-matching-request", { matchingMemberId: matchingMemberId });
});

// 채팅방 퇴장 시
function exitChatroom(chatroomUuid) {
  console.log(`Exit chatroom with UUID: ${chatroomUuid}`);

  // (#14-1) 8080서버에 채팅방 나가기 API 요청
  exitChatroomApi(chatroomUuid).then(() => {
    // (#14-2) 채팅방 나가기 API 정상 응답 받음
    // (#14-3) socket 서버에 exit-chatroom event emit
    socket.emit("exit-chatroom", { uuid: currentViewingChatroomUuid });

    // (#14-5) 채팅방 영역 초기화
    resetChatroomDiv(chatroomUuid);
  });
}

// 채팅방 내부 메뉴 버튼 생성
function createChatroomMenuButton(isFriend) {
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
    exitChatroom(currentViewingChatroomUuid);
  });

  if (isFriend) {
    // 친구 삭제 메뉴 생성
    createMenuItem(ul, "친구 삭제", () => {
      // 8080서버에 친구 삭제 API 요청
      deleteFriendApi(currentChattingMemberId).then((result) => {
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
      sendFriendRequestApi(currentChattingMemberId).then((result) => {
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
      blockMemberApi(currentChattingMemberId).then((result) => {
        // (#15-2) 회원 차단 API 정상 응답 받음
        blockPopup.style.display = "none"; // 팝업 창 닫기
        alert(result);

        // (#15-3) socket 서버에 exit-chatroom event emit
        socket.emit("exit-chatroom", { uuid: currentViewingChatroomUuid });

        // (#15-5) 채팅방 영역 초기화
        resetChatroomDiv(currentViewingChatroomUuid);
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
function resetChatroomDiv(chatroomUuid) {
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

  // systemFlag 초기화
  currentSystemFlag = null;
}

// 채팅방 입장/시작 API 응답으로 채팅방 영역 화면 렌더링 메소드
function renderChatroomDiv(result) {
  // 기존 메시지 element 초기화
  const messagesElement = document.getElementById("messages");
  const shouldScrollToBottom = messagesElement.scrollTop === messagesElement.scrollHeight - messagesElement.clientHeight;

  messagesElement.innerHTML = "";

  // (#9-7),(#13-7),(#16-8)  API 응답의 chatMessageDtoList에 대해 각 messgae 요소 렌더링
  result.chatMessageList.chatMessageDtoList.forEach((message) => {
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
    }
    messagesElement.appendChild(li);
  });

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
    const isOnline = onlineFriendMemberIdList.includes(result.memberId);
    const statusText = isOnline ? "online" : "offline";

    // 상태 element에 class 부여
    const statusElement = document.createElement("span");
    statusElement.textContent = `(${statusText})`;
    statusElement.classList.add(isOnline ? "online" : "offline");

    // 채팅방 헤더에 상태 element 추가
    chatroomHeader.appendChild(statusElement);
  }

  // (#9-9),(#13-9),(#16-10) 채팅방 내부 헤더 메뉴 버튼 생성
  createChatroomMenuButton(result.friend);

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
