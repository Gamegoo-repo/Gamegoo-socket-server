async function recordMatchingApi(matchingType, gameMode, mike ,mainP, subP, wantP, gameStyle1, gameStyle2, gameStyle3) {
    try {
        const jwtToken = localStorage.getItem("jwtToken");

        // GamegooSocketServer 프론트에서 gameStyle 3개 중 하나라도 빠지면 API에서 500 인터널 에러가 발생하지만 JAVA API 자체는 문제 없다.
        // 나중에 React로 프론트 구현할 때 gameStyle 개수에 따라서 예외처리하면 해결된다.
        const gameStyleIdList = [gameStyle1, gameStyle2, gameStyle3];

        const response = await fetch(`${API_SERVER_URL}/v1/matching`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                matchingType: matchingType,
                gameMode: gameMode,
                mike: mike,
                mainP: mainP,
                subP: subP,
                wantP: wantP,
                gameStyleIdList: gameStyleIdList
            })
        });

        const data = await response.json();
        if (data.isSuccess && data.result) {
            return data.result;
        } else {
            throw new Error("Matching failed");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
