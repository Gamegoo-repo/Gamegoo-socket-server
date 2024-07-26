const { handleAlarmEvents } = require("./alarmHandler");

function initAlarm(socket, io) {
  handleAlarmEvents(socket, io);
}

module.exports = initAlarm;
