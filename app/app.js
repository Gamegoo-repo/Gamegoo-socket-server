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

// 프로필 이미지 제공
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
            </div>
            <div>
              <p id="loginStatus">You are not Login User</p>
              <button id="notificationButton" class="notification-button">🔔</button>
            </div>
            <div id="notificationList" class="notifications">
              <div class="notification-header">
                <h2>알림</h2>
                <button id="viewAllButton">전체보기</button>
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
              <h2>친구 목록</h2>
              <ul id="friendsList"></ul>
              <button id="fetchFriendsButton">친구 목록 입장</button>
            </div>
            <div class="column">
              <h2>채팅방 목록</h2>
              <ul id="chatroomList"></ul>
              <button id="fetchChatroomsButton">채팅방 목록 페이지 입장</button>
            </div>
            <div class="column chatroom">
              <h2>채팅방</h2>
              <ul id="messages" class="messages"></ul>
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
          addNotification('friendRequest', '알림 내용', '1시간 전', false);
        </script>
      </body>
    </html>
  `);
});

module.exports = { app, server };
