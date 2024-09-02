let elapsedSeconds = 0; // 타이머 경과된 시간 (초)
let searchingTimerInterval; // 매칭중 타이머
let timers = {};

let isMatchingSuccessSenderArrived = false; // matching-success-sender가 도착했는지 여부를 추적

// 포지션 값을 텍스트로 변환하는 함수
const positionMap = {
  0: "랜덤",
  1: "탑",
  2: "정글",
  3: "미드",
  4: "원딜",
  5: "서포터",
};

function setUpMatchingSocketListeners() {
  // "matching-started" listener
  socket.on("matching-started", (response) => {
    // 매칭중 화면 렌더링
    document.getElementById("initial-screen").style.display = "none";
    document.getElementById("matching-screen").style.display = "block";

    // 매칭중 화면 스탑워치 시작
    const timerElement = document.querySelector(".timer");
    timerElement.style.display = "block";
    elapsedSeconds = 0; // 스탑워치 초기화
    searchingTimerInterval = setInterval(updateTimer, 1000); // 1초마다 updateTimer 함수 실행

    // 내 매칭 요청 정보 렌더링
    renderMyMatchingData(response.data);

    // 2분 타이머 시작, matching retry call back
    const timeoutId = setTimeout(() => {
      // 2분 동안 "matching-found-sender" or "matching-found-receiver" 이벤트가 발생하지 않으면 매칭 재시작 요청
      socket.emit("matching-retry", { priority: 50 });

      // 3분 타이머 시작, matching_not_found 
      const timeoutIdforNotFound = setTimeout(()=>{        
        // matching_retry 이후 "matching-found-sender" or "matching-found-receiver" 이벤트가 발생하지 않을 경우 matching-not-found emit 전송
        socket.emit("matching-not-found");

        alert("매칭을 찾을 수 없습니다.");

        window.location.href = "/";

      },180000); // 180000ms = 3분
    }, 120000); // 120000ms = 2분

    timers.matchingRetryCallback = timeoutId;
    timers.matchingNotFoundCallback = timeoutIdforNotFound;
    console.log(timers);

  });

  // "matching-found-receiver" event listener : receiver socket
  socket.on("matching-found-receiver", (response) => {
    // 매칭 상대가 정해졌으므로, matchingRetry callback 취소
    clearTimeout(timers.matchingRetryCallback);
    delete timers.matchingRetryCallback;
    
    // 매칭 상대가 정해졌으므로, matchingNotFound callback 취소
    clearTimeout(timers.matchingNotFoundCallback);
    delete timers.matchingNotFoundCallback;

    // 13) matching-found-success emit
    socket.emit("matching-found-success", { senderMemberId: response.data.memberId, gameMode: response.data.gameMode });

    // 10초 타이머 시작, matchingSuccessReceiver call back
    const timeoutId = setTimeout(() => {
      // 10초 동안 내가 매칭 다시하기 버튼 누르지 않으면, matching-success-receiver emit
      socket.emit("matching-success-receiver");

      // 10초 후, 5초 타이머 시작, MatchingFail call back
      const timeoutId = setTimeout(() => {
        // 5초 동안 "matching-success" or "matching-fail" 이벤트 발생하지 않으면 matching-fail emit
        socket.emit("matching-fail");
      }, 5000);

      timers.matchingFailCallback = timeoutId;
    }, 10000); // 10000ms = 10초

    timers.matchingSuccessReceiver = timeoutId;

    // 매칭 상대 정보 렌더링
    updateRightSide(response.data);

    // 매칭 나가기 버튼 활성화 및 10초 카운트다운
    startRetryCountdown();

    // 매칭 top bar 스탑워치 종료 및 매칭완료로 변경
    updateMatchingTopBar();
  });

  // "matching-found-sender" event listener : sender socket
  socket.on("matching-found-sender", (response) => {
    // 23) matching-found-sender event listen
    // 매칭 상대가 정해졌으므로, matchingRetry callback 취소
    clearTimeout(timers.matchingRetryCallback);
    delete timers.matchingRetryCallback;

    // 매칭 상대가 정해졌으므로, matchingNotFound callback 취소
    clearTimeout(timers.matchingNotFoundCallback);
    delete timers.matchingNotFoundCallback;

    // 10초 타이머 시작, matchingSuccessSender call back
    setTimeout(() => {
      // 10초 이내에 matching-success-sender가 내 소켓에 도착했으면, 10초 후에 matching-success-final emit
      // 타이머 종료 시점에서 matching-success-sender가 도착했는지 확인
      if (isMatchingSuccessSenderArrived) {
        // 24) matching-success-sender가 도착한 경우에만 matching-success-final을 emit
        socket.emit("matching-success-final");
        isMatchingSuccessSenderArrived = false;
      }

      // 10초 후, 3초 타이머 시작, matchingFail call back
      const timeoutId = setTimeout(() => {
        // 3초 동안 "matching-success" or "matching-fail" 이벤트 발생하지 않으면 matching-fail emit
        socket.emit("matching-fail");
      }, 3000);

      timers.matchingFailCallback = timeoutId;
    }, 10000); // 10000ms = 10초

    // 매칭 상대 정보 렌더링
    updateRightSide(response.data);

    // 매칭 나가기 버튼 활성화 및 10초 카운트다운
    startRetryCountdown();

    // 매칭 top bar 스탑워치 종료 및 매칭완료로 변경
    updateMatchingTopBar();
  });

  socket.on("matching-success-sender", () => {
    // matching-success-sender가 도착했음을 기록
    isMatchingSuccessSenderArrived = true;
  });

  socket.on("matching-success", (response) => {
    // 최종 매칭 결과가 도착했으므로, matchingFail callback clear
    clearTimeout(timers.matchingFailCallback);
    delete timers.matchingFailCallback;

    // 세션 스토리지에 chatroomUuid 저장
    sessionStorage.setItem("fromMatchPage", response.data.chatroomUuid);

    // 채팅 화면 경로로 리디렉션
    window.location.href = "/";
  });

  socket.on("matching-fail", (response) => {
    // 최종 매칭 결과가 도착했으므로, matchingFail callback clear
    clearTimeout(timers.matchingFailCallback);
    delete timers.matchingFailCallback;
  });
}

// 타이머 업데이트 메소드
function updateTimer() {
  let minutes = Math.floor(elapsedSeconds / 60);
  let seconds = elapsedSeconds % 60;

  // 숫자가 한 자리일 경우, 앞에 0을 추가
  let formattedTime = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  timerElement.textContent = formattedTime;

  elapsedSeconds++; // 1초씩 증가
}

// 내 매칭 요청 데이터 렌더링 메소드
function renderMyMatchingData(data) {
  // left-side 안에 있는 요소들을 선택
  document.querySelector(".left-side .user-nickname").textContent = data.gameName;
  document.querySelector(".left-side .user-tag").textContent = `#${data.tag}`;
  document.querySelector(".left-side .user-rank").textContent = `${data.tier} ${data.rank}`;
  document.querySelector(".left-side .mike-status span").textContent = data.mike ? "ON" : "OFF";

  // 프로필 이미지 설정
  document.querySelector(".left-side .profile-img").src = data.profileImg;

  // 포지션 설정
  document.querySelector(".left-side .main-position span").textContent = positionMap[data.mainPosition];
  document.querySelector(".left-side .sub-position span").textContent = positionMap[data.subPosition];
  document.querySelector(".left-side .wanted-position span").textContent = positionMap[data.wantPosition];

  // 게임스타일 리스트 동적 생성
  const gameStleList = document.querySelector(".left-side #gamestyle-list");
  gameStleList.innerHTML = ""; // 기존 리스트 초기화

  data.gameStyleList.forEach((style) => {
    const li = document.createElement("li");
    li.textContent = style;
    gameStleList.appendChild(li);
  });
}

// 상대 매칭 요청 데이터 렌더링 메소드
function updateRightSide(data) {
  const rightSide = document.querySelector(".right-side");

  // 동적으로 생성할 새로운 HTML
  rightSide.innerHTML = `
    <h4 class="user-nickname">${data.gameName}</h4> <!-- 닉네임 -->
    <p class="user-tag">#${data.tag}</p> <!-- 태그 -->
    <p class="user-rank">${data.tier} ${data.rank}</p> <!-- 등급 -->
    <div class="profileImg">
      <img src="${data.profileImg}" alt="avatar" class="profile-img"> <!-- 아바타 -->
    </div>
    <p class="mike-status">마이크 <span>${data.mike ? "ON" : "OFF"}</span></p> <!-- 마이크 상태 -->
    <div class="gamestyle">
      <ul id="gamestyle-list">
        ${data.gameStyleList.map((style) => `<li>${style}</li>`).join("")}
      </ul>
    </div>
    <div class="positions">
      <div class="main-position">주 포지션: <span>${positionMap[data.mainPosition]}</span></div> <!-- 메인 포지션 -->
      <div class="sub-position">부 포지션: <span>${positionMap[data.subPosition]}</span></div> <!-- 서브 포지션 -->
      <div class="wanted-position">내가 찾는 포지션: <span>${positionMap[data.wantPosition]}</span></div> <!-- 원하는 상대 포지션 -->
    </div>
  `;
}

// 매칭 다시하기 버튼 보여주기 및 10초 카운트 다운
function startRetryCountdown() {
  const retryButton = document.querySelector(".retry-button");
  const retryTimerValue = document.getElementById("retry-timer-value");

  // 버튼을 보여줌
  retryButton.style.display = "inline-block"; // or 'block', depending on your layout

  console.log(retryButton);
  // 클릭되면 matching-fail emit
  retryButton.addEventListener("click", ()=> {
    console.log("MATCHING_FAILED");
    socket.emit("matching-fail");
    window.location.href("/");
  });

  let countdown = 10; // 카운트다운 시작 값

  // 카운트다운 함수
  const countdownInterval = setInterval(() => {
    countdown--; // 1초에 1씩 감소
    retryTimerValue.textContent = countdown; // 화면에 표시되는 값 업데이트

    // 카운트가 0이면 카운트다운 멈추고 버튼 숨기기
    if (countdown <= 0) {
      clearInterval(countdownInterval); // 카운트다운 정지
      retryButton.style.display = "none"; // 버튼 숨김
    }
  }, 1000); // 1초 간격으로 실행
}

function updateMatchingTopBar() {
  // 매칭 중 스탑워치 종료
  clearInterval(searchingTimerInterval); // 매칭중 스탑워치 멈춤
  searchingTimerInterval = null; // 전역변수 초기화

  // h3 요소의 텍스트를 "매칭 완료"로 변경
  const titleElement = document.querySelector(".matching-title h3");
  titleElement.textContent = "매칭 완료";

  // 타이머 요소를 보이지 않게 설정
  const timerElement = document.querySelector(".timer");
  timerElement.style.display = "none";
}
