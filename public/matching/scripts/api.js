async function recordMatchingApi(matchingType, gameMode, mike, mainP, subP, wantP, gameStyle1, gameStyle2, gameStyle3) {
    console.log("recordMatchingAPI : ");
    try {
        const jwtToken = localStorage.getItem("jwtToken");
        const gameStyleIdList = [gameStyle1, gameStyle2, gameStyle3];;
        
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