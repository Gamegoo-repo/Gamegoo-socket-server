// eventBus를 통해 여러 모듈에서 EventEmitter 객체를 전역 공유
const EventEmitter = require("events");
const eventEmitter = new EventEmitter();
module.exports = eventEmitter;
