const matchBtn = document.getElementById('match-btn');

// 사용자가 매칭을 시도할 때
matchBtn.addEventListener('click', () => {
    const matchingType = document.getElementById('matching-type').value;
    const gameMode = document.getElementById('game-mode').value;
    const mike = document.getElementById('mike').checked;
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
    console.log('Main P: ' + mainP);
    console.log('Sub P: ' + subP);
    console.log('Want P: ' + wantP);
    console.log('==========================================');

    // input에 하나라도 안들어왔을 경우
    if (!matchingType || !gameMode || !mainP || !subP || !wantP) {
        alert("input value should be filled.");
        return;
    }

    // (#5-1) 매칭 시작 emit
    socket.emit("matching_started", {
        matchingType: matchingType,
        gameMode: gameMode,
        mike: mike,
        mainP: mainP,
        subP: subP,
        wantP: wantP,
        gameStyle1: gameStyle1,
        gameStyle2: gameStyle2,
        gameStyle3: gameStyle3
    });

});