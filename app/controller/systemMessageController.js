const { successResponse, failResponse } = require("../common/responseFormatter");

function countUsersInMatching(io) {
    return async (req, res) => {

        const { tier } = req.query;  // 쿼리 파라미터에서 데이터 받기

        // 현재 연결된 socket 중 해당 memberId를 가진 socket 객체 list 추출
        let numberOfSocketsInRoom=0;
        try {
            const connectedSockets = await io.fetchSockets();

            for (let i = 1; i <= 4; i++) {

                // 매칭 room에 들어가있는 소켓들 필터링
                const roomName = "GAMEMODE_" + i;
                const socketsInRoom = connectedSockets.filter(socket => socket.rooms.has(roomName));
                
                // Tier 값에 따라 요청한 Tier 에 해당하는 매칭 사용자 수 계산
                if(tier){
                    for (const connSocket of socketsInRoom) {
                        if(connSocket.myMatchingInfo.tier == tier){
                            numberOfSocketsInRoom++;
                        }
                    }
                }
                // Tier 상관 없이 전체 매칭 사용자 수 계산
                else{                
                    numberOfSocketsInRoom = numberOfSocketsInRoom + socketsInRoom.length;
                }
            }
            res.status(200).json(successResponse({number:numberOfSocketsInRoom}));

        } catch (error) {
            res.status(500).json(failResponse("SOCKET510", "매칭 중인 인원을 불러오는 도중 에러가 발생했습니다."));
        }

        
    };
}

module.exports = (io) => {
    return {
        countUsersInMatching: countUsersInMatching(io),
    };
};
