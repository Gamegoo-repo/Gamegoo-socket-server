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
            <p id="loginStatus">You are not Login User</p>
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
      </body>
    </html>
  `);
});

module.exports = { app, server };
