let elapsedSeconds = 0;
let searchingTimerInterval;
let timers = {};
let isMatchingSuccessSenderArrived = false; // matching-success-sender 도착 여부

/**
 * matching-started 이벤트 핸들러
 * @param {*} socket 
 * @param {*} state 
 * @param {*} data 
 */
export function handleMatchingStarted(socket, state, request) {
    console.log("MATCHING_STARTED");

    state.matchingUuid=request.data.matchingUuid;
    state.soloTier=request.data.soloTier;
    state.soloRank=request.data.soloRank;
    state.freeTier=request.data.freeTier;
    state.freeRank=request.data.freeRank;
    state.gameMode=request.data.gameMode;

    console.log("memberId : ", state.memberId, "matchingUuid: ", state.matchingUuid);

    // 매칭중 화면 렌더링
    document.getElementById("initial-screen").style.display = "none";
    document.getElementById("matching-screen").style.display = "block";

    // quit 버튼 이벤트 등록
    const quitButton = document.querySelector(".quitButton");
    quitButton.addEventListener("click", () => {
        alert("💔 MATCHING_QUIT");
        socket.emit("matching-quit");
        clearInterval(searchingTimerInterval);
        clearInterval(timers.matchingRetryInterval);
        clearTimeout(timers.matchingNotFoundCallback);
    });

    // 매칭중 화면 스탑워치 시작
    const timerElement = document.querySelector(".timer");
    timerElement.style.display = "block";
    elapsedSeconds = 0;
    searchingTimerInterval = setInterval(updateTimer, 1000); // 1초마다 updateTimer 실행

    // 내 매칭 요청 정보 렌더링
    console.log("request.data : ",request.data);
    renderMyMatchingData(request.data);

    // 30초 후 매칭 확인 및 5분 동안 30초마다 threshold 낮춰 재시도 로직 추가
    let threshold = 20;
    let retryCount = 0;
    let maxRetries = 10;

    function matchingRetryLoop() {
        if (isMatchingSuccessSenderArrived) {
            console.log("✅ Matching Found - Stopping Retry");
            clearInterval(timers.matchingRetryInterval);
            return;
        }

        if (retryCount < maxRetries) {
            console.log(`⏳ ${retryCount + 1}번째 매칭 재시도 - 현재 threshold: ${threshold}`);
            socket.emit("matching-retry", { threshold : threshold });
            threshold = Math.max(0, threshold - 1.5); // threshold를 1.5씩 낮춤, 최소 0까지 가능
            retryCount++;
        } else {
            console.log("❌ 5분 경과 - 매칭 실패");
            clearInterval(timers.matchingRetryInterval);
            socket.emit("matching-not-found");

            alert("매칭을 찾을 수 없습니다.");
            window.location.href = "/";
        }
    }

    // 30초 후 첫 번째 matching-retry 실행 후, 30초마다 반복 실행
    timers.matchingRetryInterval = setInterval(matchingRetryLoop, 30000);

    // 5분 후에도 매칭되지 않으면 matching-not-found 실행
    timers.matchingNotFoundCallback = setTimeout(() => {
        console.log("❌ 5분 경과 - 매칭 실패");
        clearInterval(timers.matchingRetryInterval);
        timers.matchingRetryInterval=null;
        socket.emit("matching-not-found");

        alert("매칭을 찾을 수 없습니다.");
        window.location.href = "/";
    }, 300000); // 5분 (300초)
}

/**
 * "matching-found-receiver"
 * @param {*} socket 
 * @param {*} state 
 * @param {*} request 
 */
export function handleMatchingFoundReceiver(socket, state, request) {
    console.log("✅ MATCHING FOUND Receiver!");
    isMatchingSuccessSenderArrived = true; // 매칭 성공 플래그 업데이트
    clearInterval(timers.matchingRetryInterval); // 매칭 재시도 타이머 중지
    clearTimeout(timers.matchingNotFoundCallback); // 5분 후 강제 종료 타이머 중지
    delete timers.matchingRetryInterval;
    delete timers.matchingNotFoundCallback;
    
    // state에 저장
    state.matchingUuid = request.data.receiverMatchingUuid;

    // 13) matching-found-success emit
    socket.emit("matching-found-success", { senderMatchingUuid: request.data.senderMatchingInfo.matchingUuid });
    // socket.emit("matching-found-success", { senderMatchingUuid: state.matchingUuid });


    // 10초 타이머 시작, matchingSuccessReceiver call back
    const timeoutId = setTimeout(() => {
        // 10초 동안 내가 매칭 다시하기 버튼 누르지 않으면, matching-success-receiver emit
        socket.emit("matching-success-receiver",{ senderMatchingUuid: request.data.senderMatchingInfo.matchingUuid });

        // 10초 후, 3초 타이머 시작, MatchingFail call back
        const timeoutId = setTimeout(() => {
            // 3초 동안 "matching-success" or "matching-fail" 이벤트 발생하지 않으면 matching-fail emit
            socket.emit("matching-fail");
        }, 3000);

        timers.matchingFailCallback = timeoutId;
    }, 10000); // 10000ms = 10초
    timers.matchingSuccessReceiver = timeoutId;  


    // 매칭 상대 정보 렌더링
    updateRightSide(request.data.senderMatchingInfo);

    // 매칭 나가기 버튼 활성화 및 10초 카운트다운
    startRetryCountdown(socket,timers);

    // quit 제대로 동작하는지 확인하기 위한 버튼
    const quitButton = document.querySelector(".quit-button");

    // 클릭되면 matching-fail emit
    quitButton.addEventListener("click", () => {
        console.log("MATCHING_QUIT");
        clearInterval(timers.matchingRetryInterval); // 매칭 재시도 타이머 중지
        clearTimeout(timers.matchingNotFoundCallback); // 5분 후 강제 종료 타이머 중지
        delete timers.matchingRetryInterval;
        delete timers.matchingNotFoundCallback;
        socket.emit("matching-quit");
    });

    // 매칭 top bar 스탑워치 종료 및 매칭완료로 변경
    updateMatchingTopBar();
}

/**
 * "matching-found-sender"
 * @param {*} socket 
 * @param {*} state 
 * @param {*} request 
 */
export function handleMatchingFoundSender(socket, state, request) {
    console.log("✅ MATCHING FOUND Sender!");

    // 매칭 재시도 타이머 중지
    clearInterval(timers.matchingRetryInterval); 
    delete timers.matchingRetryInterval;

    // 매칭 상대가 정해졌으므로, matchingNotFound callback 취소
    clearTimeout(timers.matchingNotFoundCallback);
    delete timers.matchingNotFoundCallback;

    // 10초 타이머 시작, matchingSuccessSender call back
    const timeoutId = setTimeout(() => {
        // 10초 이내에 matching-success-sender가 내 소켓에 도착했으면, 10초 후에 matching-success-final emit
        // 타이머 종료 시점에서 matching-success-sender가 도착했는지 확인
        if (isMatchingSuccessSenderArrived) {
            // 24) matching-success-sender가 도착한 경우에만 matching-success-final을 emit
            socket.emit("matching-success-final");
            isMatchingSuccessSenderArrived = false;
        }

        // 10초 후, 2초 타이머 시작, matchingFail call back
        const timeoutId = setTimeout(() => {
            // 2초 동안 "matching-success" or "matching-fail" 이벤트 발생하지 않으면 matching-fail emit
            socket.emit("matching-fail");
        }, 2000);

        timers.matchingFailCallback = timeoutId;
    }, 10000); // 10000ms = 10초

    timers.matchingSuccessCallback = timeoutId;

    // 매칭 상대 정보 렌더링
    updateRightSide(request.data);

    // 매칭 나가기 버튼 활성화 및 10초 카운트다운
    startRetryCountdown(socket,timers);

    // quit 제대로 동작하는지 확인하기 위한 버튼
    const quitButton = document.querySelector(".quit-button");

    // 클릭되면 matching-fail emit
    quitButton.addEventListener("click", () => {
        console.log("MATCHING_QUIT");
        
        socket.emit("matching-quit");

    });

    // 매칭 top bar 스탑워치 종료 및 매칭완료로 변경
    updateMatchingTopBar();
}

/**
 *  "matching-success-sender"
 */
export function handleMatchingSuccessSender() {
    // matching-success-sender가 도착했음을 기록
    isMatchingSuccessSenderArrived = true;
}

/**
 * "matching-success"
 * @param {*} request 
 */
export function handleMatchingSuccess(request) {
    // 최종 매칭 결과가 도착했으므로, matchingFail callback clear
    clearTimeout(timers.matchingFailCallback);
    delete timers.matchingFailCallback;

    alert("매칭 성공!!!");
    // 세션 스토리지에 chatroomUuid 저장
    sessionStorage.setItem("fromMatchPage", request.data.chatroomUuid);

    // 채팅 화면 경로로 리디렉션
    window.location.href = "/";
}

/**
 * "matching-fail"
 * @param {*} socket 
 * @param {*} request 
 */
export function handleMatchingFail(socket, request) {
    Object.keys(timers).forEach(function (timer) {
        clearTimeout(timers[timer]);
        delete timers[timer];
    });

    console.log("❌ MATCHING FAIL");
    socket.emit("matching-fail");

}

/**
 * "matching-count"
 * @param {*} socket 
 * @param {*} request 
 */
export function handleMatchingCount(state, request) {
    const data = request.data;
    const userCount = data.userCount;
    const tierCount = data.tierCount;
    let myTier=state.soloTier;
    if(state.gameMode=="FREE"){
        myTier=state.freeTier;
    }

    // 총 유저 수 표시
    const totalUserCountElement = document.getElementById("totalUserCount");
    if (totalUserCountElement) {
      totalUserCountElement.textContent = `현재 게임 모드에서 대기 중인 유저 수: ${userCount}명`;
    }
    // 내 티어에 해당하는 사용자 수 표시
    // console.log(tierCount);
    const myTierCount = tierCount[myTier] ?? 0;
    // console.log(myTierCount);
    const myTierUserCountElement = document.getElementById("TierUserCount");
    if (myTierUserCountElement) {
      myTierUserCountElement.textContent = `내 티어의 대기 중인 유저 수: ${myTierCount}명`;
    }
}

// 타이머 업데이트
function updateTimer() {
    elapsedSeconds++;
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    // 타이머 값 업데이트
    const timerValueElement = document.getElementById("timer-value");
    if (timerValueElement) {
        timerValueElement.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    } else {
        console.warn("⏰ Timer element not found!");
    }
}

// 내 매칭 요청 데이터 렌더링 메소드
function renderMyMatchingData(data) {
    // left-side 안에 있는 요소들을 선택
    document.querySelector(".left-side .user-nickname").textContent = data.gameName;
    document.querySelector(".left-side .user-tag").textContent = `#${data.tag}`;
    document.querySelector(".left-side .user-soloRank").textContent = `${data.soloTier} ${data.soloRank}`;
    document.querySelector(".left-side .user-freeRank").textContent = `${data.freeTier} ${data.freeRank}`;
    document.querySelector(".left-side .mike-status span").textContent = data.mike ? "ON" : "OFF";

    // 프로필 이미지 설정
    document.querySelector(".left-side .profile-img").src = data.profileImg;

    // 포지션 설정
    document.querySelector(".left-side .main-position span").textContent = data.mainP;
    document.querySelector(".left-side .sub-position span").textContent = data.subP;
    const wantPSpan = document.querySelector(".left-side .wanted-position span");
    if (Array.isArray(data.wantP)) {
        wantPSpan.textContent = data.wantP.join(", ");
    } else {
        wantPSpan.textContent = data.wantP ?? "";
    }

    // 게임스타일 리스트 동적 생성
    const gameStleList = document.querySelector(".left-side #gamestyle-list");
    gameStleList.innerHTML = ""; // 기존 리스트 초기화

    data.gameStyleResponseList.forEach((style) => {
        const li = document.createElement("li");
        li.textContent = style.gameStyleName;
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
      <p class="user-soloRank"> ${data.soloTier} ${data.soloRank}</p> <!-- 등급 -->
      <p class="user-freeRank">${data.freeTier} ${data.freeRank}</p> <!-- 등급 -->
      <div class="profileImg">
        <img src="${data.profileImg}" alt="avatar" class="profile-img"> <!-- 아바타 -->
      </div>
      <p class="mike-status">마이크 <span>${data.mike ? "ON" : "OFF"}</span></p> <!-- 마이크 상태 -->
      <div class="gamestyle">
        <ul id="gamestyle-list">
          ${data.gameStyleResponseList.map((style) => `<li>${style.gameStyleName}</li>`).join("")}
        </ul>
      </div>
      <div class="positions">
        <div class="main-position">주 포지션: <span>${data.mainP}</span></div> <!-- 메인 포지션 -->
        <div class="sub-position">부 포지션: <span>${data.subP}</span></div> <!-- 서브 포지션 -->
        <div class="wanted-position">내가 찾는 포지션: <span>${Array.isArray(data.wantP) ? data.wantP.join(", ") : (data.wantP ?? "")}</span></div> <!-- 원하는 상대 포지션 -->
      </div>
  
      <button class="quit-button"> QUIT </button>
    `;
}

// 매칭 다시하기 버튼 보여주기 및 10초 카운트 다운
function startRetryCountdown(socket,timers) {
    const retryButton = document.querySelector(".retryButton");
    const retryTimerValue = document.getElementById("retryTimerValue");

    // 버튼을 보여줌
    retryButton.style.display = "inline-block"; 

    // 클릭되면 matching-fail emit
    retryButton.addEventListener("click", () => {
        console.log("MATCHING_REJECT");
        socket.emit("matching-reject");

        Object.keys(timers).forEach(function (timer) {
            clearTimeout(timers[timer]);
            delete timers[timer];
        });
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
