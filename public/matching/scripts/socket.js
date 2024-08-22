let elapsedSeconds = 0; // 타이머 경과된 시간 (초)
let timerInterval;
let timers = {};

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
  // "matching_started" listener
  socket.on("matching_started", (response) => {
    // 매칭중 화면 렌더링
    document.getElementById("initial-screen").style.display = "none";
    document.getElementById("matching-screen").style.display = "block";

    // 매칭중 화면 스탑워치 시작
    elapsedSeconds = 0; // 스탑워치 초기화
    timerInterval = setInterval(updateTimer, 1000); // 1초마다 updateTimer 함수 실행

    // 내 매칭 요청 정보 렌더링
    renderMyMatchingData(response.data);

    // 2분 타이머 시작, matching retry call back
    const timeoutId = setTimeout(() => {
      // 2분 동안 "matching_found_sender" or "matching-found-receiver" 이벤트가 발생하지 않으면 매칭 재시작 요청
      socket.emit("matching_retry");
    }, 120000); // 120000ms = 2분

    timers.matchingRetryCallback = timeoutId;
    console.log(timers);
  });

  // "matching_found_sender" event listener : sender socket
  socket.on("matching_found_sender", (response) => {
    // 매칭 상대가 정해졌으므로, matchingRetry callback 취소
    clearTimeout(timers.matchingRetryCallback);
    delete timers.matchingRetryCallback;

    // 10초 타이머 시작

    // 매칭 상대 정보 렌더링

    // 매칭 나가기 버튼 활성화 및 10초 카운트다운
  });

  // "matching_found_receiver" event listener : receiver socket
  socket.on("matching_found_receiver", (response) => {
    // 매칭 상대가 정해졌으므로, matchingRetry callback 취소
    clearTimeout(timers.matchingRetryCallback);
    delete timers.matchingRetryCallback;

    socket.emit("matching_found_success", { senderMemberId: response.data.memberId });
    // 10초 타이머 시작
    // 매칭 상대 정보 렌더링
    // 매칭 나가기 버튼 활성화 및 10초 카운트다운
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
