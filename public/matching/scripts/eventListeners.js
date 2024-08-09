const matchBtn = document.getElementById('match-btn');

matchBtn.addEventListener('click', () => {
    const matchingType = document.getElementById('matching-type').value;
    const gameMode = document.getElementById('game-mode').value;
    const mike = document.getElementById('mike').checked;
    const tier = document.getElementById('tier').value;
    const rank = document.getElementById('rank').value;
    const manner = document.getElementById('manner').value;
    const mainP = document.getElementById('mainP').value;
    const subP = document.getElementById('subP').value;
    const wantP = document.getElementById('wantP').value;
    const gameStyle1 = document.getElementById('gameStyle1').value;
    const gameStyle2 = document.getElementById('gameStyle2').value;
    const gameStyle3 = document.getElementById('gameStyle3').value;


    console.log('========== Matching Information ==========');
    console.log('Matching Type: ' + matchingType);
    console.log('Game Mode: ' + gameMode);
    console.log('Mike: ' + mike);
    console.log('Tier: ' + tier);
    console.log('Rank: ' + rank);
    console.log('Manner: ' + manner);
    console.log('Main P: ' + mainP);
    console.log('Sub P: ' + subP);
    console.log('Want P: ' + wantP);
    console.log('==========================================');

    // input에 하나라도 안들어왔을 경우
    if (!matchingType || !gameMode || !tier || !rank || !manner || !mainP || !subP || !wantP) {
        alert("input value should be filled.");
        return;
    }

    // 매칭 알림 소켓으로 보내기
    socket.emit("matching_started", {
        matchingType: matchingType,
        gameMode: gameMode,
        mike: mike,
        tier: tier,
        rank: rank,
        manner: manner,
        mainP: mainP,
        subP: subP,
        wantP: wantP
    });

    // 매칭 기록하기 (Java API)
    recordMatchingApi(matchingType, gameMode, mike, manner, mainP, subP, wantP, gameStyle1, gameStyle2, gameStyle3);



});