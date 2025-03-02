let elapsedSeconds = 0;
let searchingTimerInterval; 
let timers = {};
let isMatchingSuccessSenderArrived = false; 

// 포지션 값을 텍스트로 변환하는 함수
const positionMap = {
    0: "랜덤",
    1: "탑",
    2: "정글",
    3: "미드",
    4: "원딜",
    5: "서포터",
};

/**
 * 타이머 업데이트
 */
function updateTimer() {
    elapsedSeconds++; // 1초 증가
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

/**
 * matching-started
 * @param {*} socket 
 * @param {*} state 
 * @param {*} data 
 */
export function handleMatchingStarted(socket, state, data) {
    console.log("✅ MATCHING_STARTED");
    
    // 매칭중 화면 렌더링
    document.getElementById("initial-screen").style.display = "none";
    document.getElementById("matching-screen").style.display = "block";

    // quit 버튼 이벤트 등록
    const quitButton = document.querySelector(".quitButton");
    quitButton.addEventListener("click", () => {
        console.log("❌ MATCHING_QUIT");
        socket.emit("matching-quit");
        clearInterval(searchingTimerInterval); 
    });

    // 매칭중 화면 스탑워치 시작
    const timerElement = document.querySelector(".timer");
    timerElement.style.display = "block";
    elapsedSeconds = 0; // 스탑워치 초기화
    searchingTimerInterval = setInterval(updateTimer, 1000); // 1초마다 updateTimer 실행

    // 내 매칭 요청 정보 렌더링
    renderMyMatchingData(data); 

    // 2분 타이머 시작 (matching retry)
    const timeoutId = setTimeout(() => {
        console.log("⏳ 2분 지남 → 매칭 재시도 요청");
        socket.emit("matching-retry", { priority: 45 });

        // 3분 타이머 시작 (matching_not_found)
        const timeoutIdforNotFound = setTimeout(() => {
            console.log("❌ 3분 지남 → 매칭 실패, 재시도 종료");
            socket.emit("matching-not-found");

            alert("매칭을 찾을 수 없습니다.");
            window.location.href = "/";

        }, 180000); // 3분 (180초)
    }, 120000); // 2분 (120초)

    timers.matchingRetryCallback = timeoutId;
    timers.matchingNotFoundCallback = timeoutIdforNotFound;
}
