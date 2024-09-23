const { successResponse, failResponse } = require("../common/responseFormatter");

function countUsersInMatching(io) {
    return async (req, res) => {


        // 현재 연결된 socket 중 해당 memberId를 가진 socket 객체 list 추출
        let numberOfSocketsInRoom=0;
        try {
            const connectedSockets = await io.fetchSockets();

            for (let i = 1; i <= 4; i++) {

                // 매칭 room에 들어가있는 소켓들 필터링
                const roomName = "GAMEMODE_" + i;
                const socketsInRoom = connectedSockets.filter(socket => socket.rooms.has(roomName));
                
                // 특정 room에 속한 소켓의 개수 출력
                numberOfSocketsInRoom = numberOfSocketsInRoom + socketsInRoom.length;
            }


        } catch (error) {
            res.status(500).json(failResponse("SOCKET510", "매칭 중인 인원을 불러오는 도중 에러가 발생했습니다."));
        }

        res.status(200).json(successResponse({number:numberOfSocketsInRoom}));
        
    };
}

function countUsersInMatchingByTier(io) {
    return async (req, res) => {
        // 현재 연결된 socket 중 해당 memberId를 가진 socket 객체 list 추출
        let numberOfSocketsInRoom=0;
        try {
            const connectedSockets = await io.fetchSockets();
            for (const connSocket of connectedSockets) {
                console.log("socket"+connSocket);
            }
            for (let i = 1; i <= 4; i++) {

                // 매칭 room에 들어가있는 소켓들 필터링
                const roomName = "GAMEMODE_" + i;
                const socketsInRoom = connectedSockets.filter(socket => socket.rooms.has(roomName));
                
                
                // 특정 room에 속한 소켓의 개수 출력
                numberOfSocketsInRoom = numberOfSocketsInRoom + socketsInRoom.length;
            }


        } catch (error) {
            res.status(500).json(failResponse("SOCKET510", "매칭 중인 인원을 불러오는 도중 에러가 발생했습니다."));
        }

        res.status(200).json(successResponse({number:numberOfSocketsInRoom}));
        
    };
}


module.exports = (io) => {
    return {
        countUsersInMatching: countUsersInMatching(io),
        countUsersInMatchingByTier: countUsersInMatchingByTier(io)
    };
};
