const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const config = require("../common/config");

const SOCKETIO_URL = config.socketioUrl;
const API_SERVER_URL = config.apiServerUrl;
const NODE_SERVER_URL = config.nodeServerUrl;

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: ["http://localhost:3000", "https://socket.gamegoo.co.kr"], // localhost:3000 cors 허용
    methods: ["*"], // 모든 메소드 허용
    credentials: true, // 쿠키 허용
  })
);
app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

app.get("/match", (req, res) => {
  res.send(`
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>겜구 매칭 테스트</title>
  <link rel="stylesheet" href="/matching/styles.css" /> 
</head>

<body>
  <div class="container">
  <div class="top-bar">
      <div>
        <input id="userEmail" type="string" placeholder="Enter your Email">
        <input id="userPw" type="string" placeholder="Enter your Pw">
        <button id="loginButton">Login</button>
        <button id="logoutButton">Logout</button>
      </div>
      <p id="loginStatus">You are not Login User</p>
    </div>

  <!-- 첫 번째 화면 (초기 화면) -->
  <div id="initial-screen">
    <h2>Gamegoo Matching</h2>

    <div class="input-group">
      <select id="matching-type">
        <option value="BASIC">BASIC</option>
        <option value="PRECISE">PRECISE</option>
      </select>
      <input type="number" id="game-mode" min="1" max="4" placeholder="게임 모드, 1 ~ 4">
      <label for="mike">Mike:</label>
      <input type="checkbox" id="mike">
    </div>

    <div class="input-group">
      <input type="number" id="mainP" min="0" max="5" placeholder="메인 포지션 (0 ~ 5)">
      <input type="number" id="subP" min="0" max="5" placeholder="서브 포지션 (0 ~ 5)">
      <input type="number" id="wantP" min="0" max="5" placeholder="원하는 포지션 (0 ~ 5)">
    </div>

    <div class="input-group">
      <input type="number" id="gameStyle1" min="1" max="17" placeholder="게임스타일 1 (1 ~ 17)">
      <input type="number" id="gameStyle2" min="1" max="17" placeholder="게임스타일 2 (1 ~ 17)">
      <input type="number" id="gameStyle3" min="1" max="17" placeholder="게임스타일 3 (1 ~ 17)">
    </div>

    <button id="match-btn">Match</button>
  </div>

  <!-- 두 번째 화면 (매칭 화면) -->
  <div id="matching-screen" style="display: none;">
    <div class="matching-container">
      <div class="match-top-bar">
        <div class="matching-title">
          <button class="back-button"><</button>
          <h3>매칭 중</h3>
        </div>
        <div class="timer">
          <p><span id="timer-value" style="color: #6200ea;">0:00</span> / 5:00</p>
        </div>
      </div>
      <div class="match-content">
        <div class="left-side">
          <h4 class="user-nickname"></h4> <!-- 닉네임 -->
          <p class="user-tag"></p>
          <p class="user-rank"></p> <!-- 등급 -->
          <div class="profileImg">
            <img src="avatar.png" alt="avatar" class="profile-img"> <!-- 아바타 -->
          </div>
          <p class="mike-status">마이크 <span></span></p> <!-- 마이크 상태 -->
          <div class="gamestyle">
            <ul id="gamestyle-list">
              <!-- 이곳에 동적으로 <li> 요소가 추가됩니다 -->
            </ul>
          </div>
          <div class="positions">
            <div class="main-position">주 포지션: <span>탑</span></div> <!-- 메인 포지션 -->
            <div class="sub-position">부 포지션: <span>정글</span></div> <!-- 서브 포지션 -->
            <div class="wanted-position">내가 찾는 포지션: <span>미드</span></div> <!-- 원하는 상대 포지션 -->
          </div>
        </div>
        <div class="right-side">
          <div class="waiting">
                      <div class="heart-icon">
              <img src="heart.png" alt="heart icon">
            </div>
            <p>어떤 사람이 나올까요?</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  <script>
    const API_SERVER_URL = '${API_SERVER_URL}';
    const NODE_SERVER_URL = '${NODE_SERVER_URL}';
  </script>
  <script src="${SOCKETIO_URL}"></script>
  <script src="matching/scripts/socket.js"></script>
  <script src="scripts/socket.js"></script>
  <script src="scripts/api.js"></script>
  <script src="scripts/eventListeners.js"></script>
  <script src="matching/scripts/api.js"></script>
  <script src="matching/scripts/eventListeners.js"></script>

</body>

</html>
    `);
});

// 이미지 제공
app.get("/:id", (req, res) => {
  const id = req.params.id;
  const options = {
    root: path.join(__dirname, "../public", "img"),
  };

  // Ensure the ID is a valid number between 1 and 8
  if (id >= 1 && id <= 8) {
    const fileName = `profile_${id}.png`;
    res.sendFile(fileName, options, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error sending file");
      }
    });
  } else if (id == "heart.png") {
    res.sendFile("heart.png", options, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error sending file");
      }
    });
  } else {
    res.status(404).send("Profile image not found");
  }
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Socket 서버 테스트</title>
        <link rel="stylesheet" href="styles.css" />
      </head>
      <body>
        <div class="container">
          <div class="top-bar">
            <div>
              <input id="userEmail" type="string" placeholder="Enter your Email" />
              <input id="userPw" type="string" placeholder="Enter your Pw" />
              <button id="loginButton">Login</button>
              <button id="logoutButton">Logout</button>
              <button id="boardTestButton">게시글 말 걸어보기</button>
              <button id="matchingTestButton">매칭 채팅방 시작</button>
              <!-- 게시판 ID 입력 폼을 위한 팝업 추가 -->
              <div id="boardIdPopup" class="popup">
                <div class="popup-content">
                <form id="boardIdForm">
                    <label for="boardIdInput">채팅 시작할 게시글 ID 입력</label>
                    <input type="text" id="boardIdInput" name="boardId" placeholder="Enter board ID" />
                    <button type="submit">제출</button>
                    <button type="button" id="closeBoardIdPopupButton">취소</button>
                  </form>
                </div>
              </div>
              <!-- 매칭 상대 회원 ID 입력 폼을 위한 팝업 추가 -->
              <div id="matchingMemberIdPopup" class="popup">
                <div class="popup-content">
                <form id="mathingMemberIdForm">
                    <label for="boardIdInput">매칭 시킬 회원 ID 입력</label>
                    <input type="text" id="mathingMemberIdInput" name="mathingMemberId" placeholder="Enter member ID" />
                    <button type="submit">제출</button>
                    <button type="button" id="closeMatchingMemberIdPopupButton">취소</button>
                  </form>
                </div>
              </div>


            </div>
            <div>
              <p id="loginStatus">You are not Login User</p>
              <button id="notificationButton" class="notification-button">🔔</button>
            </div>
            <div id="notificationList" class="notifications">
              <div class="notification-header">
                <h2>알림</h2>
                <button id="notiCloseButton">닫기</button>
              </div>
            <div class="tabs">
              <div class="tab active" data-tab="received">받은 알림</div>
              <div class="tab" data-tab="friendRequest">친구 요청</div>
            </div>
            <div id="notificationItems">
              <div id="receivedNotifications" class="notification-type"></div>
              <div id="friendRequestNotifications" class="notification-type" style="display: none;"></div>
            </div>  
          </div>
        </div>
          <div class="content">
            <div class="column">
              <h2>
                친구 목록
                <button id="fetchFriendsButton"> ↻ </button>
              </h2>
              <ul id="friendsList"></ul>
            </div>
            <div class="column chatroomList">
              <h2>
                채팅방 목록
                <button id="fetchChatroomsButton"> ↻ </button>
              </h2>
              <ul id="chatroomList"></ul>
            </div>
            <div class="column chatroom">
              <h2>채팅방</h2>
              <ul id="messages" class="messages"></ul>

              <!-- 팝업 추가 -->
              <div id="blockPopup" class="popup" style="display: none;">
                <div class="popup-content">
                  <p>해당 회원을 차단하면 채팅방에서 나가기 처리 됩니다. 차단하시겠습니까?</p>
                  <button id="confirmBlock">예</button>
                  <button id="cancelBlock">아니요</button>
                </div>
              </div>

              <form id="form" class="chat-form" action="">
                <input id="input" autocomplete="off" />
                <button>Send</button>
              </form>
            </div>
          </div>
        </div>
        <script>
          const API_SERVER_URL = '${API_SERVER_URL}';
          const NODE_SERVER_URL = '${NODE_SERVER_URL}';
        </script>
        <script src="${SOCKETIO_URL}"></script>
        <script src="scripts/socket.js"></script>
        <script src="scripts/api.js"></script>
        <script src="scripts/eventListeners.js"></script>
        <script>
          // 초기 알림 예시 (실제 데이터로 대체 필요)
          addNotification('received', '알림 내용', '1시간 전', true);
          addNotification('received', '알림 내용', '1시간 전', false);
          addNotification('friendRequest', '12345 님이 친구요청을 보냈습니다.', '1시간 전', true);
          addNotification('friendRequest', '67890 님이 친구요청을 보냈습니다.', '1시간 전', false);
        </script>
      </body>
    </html>
  `);
});

module.exports = { app, server };
