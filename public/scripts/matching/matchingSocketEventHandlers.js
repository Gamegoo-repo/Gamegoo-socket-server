let elapsedSeconds = 0;
let searchingTimerInterval;
let timers = {};
let isMatchingSuccessSenderArrived = false; // matching-success-sender 도착 여부

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

/**
 * matching-started 이벤트 핸들러
 * @param {*} socket 
 * @param {*} state 
 * @param {*} data 
 */
export function handleMatchingStarted(socket, state, data) {
    console.log("MATCHING_STARTED");
    
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
    renderMyMatchingData(data);

    // 🎯 30초 후 매칭 확인 및 5분 동안 30초마다 threshold 낮춰 재시도 로직 추가
    let threshold = 45;
    let retryCount = 0;
    let maxRetries = 10; // 30초마다 실행되므로 5분(10번) 동안 실행

    function matchingRetryLoop() {
        if (isMatchingSuccessSenderArrived) {
            console.log("✅ Matching Found - Stopping Retry");
            clearInterval(timers.matchingRetryInterval);
            return;
        }

        if (retryCount < maxRetries) {
            console.log(`⏳ ${retryCount + 1}번째 매칭 재시도 - 현재 threshold: ${threshold}`);
            socket.emit("matching-retry", { priority: threshold });
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
        socket.emit("matching-not-found");

        alert("매칭을 찾을 수 없습니다.");
        window.location.href = "/";
    }, 300000); // 5분 (300초)
}

/**
 * 🟢 matching-found-sender 또는 matching-found-receiver 이벤트 핸들러
 */
export function handleMatchingFound(socket, state, data) {
    console.log("✅ MATCHING FOUND!");
    isMatchingSuccessSenderArrived = true; // 매칭 성공 플래그 업데이트
    clearInterval(timers.matchingRetryInterval); // 매칭 재시도 타이머 중지
    clearTimeout(timers.matchingNotFoundCallback); // 5분 후 강제 종료 타이머 중지
}
