const { format, createLogger, transports } = require("winston"); // 로그 처리 모듈
const { combine, colorize, timestamp, printf, padLevels } = format;
var winstonDaily = require("winston-daily-rotate-file"); // 로그 일별 처리 모듈

const config = require("./config");
const EC2_LOG_PATH = config.EC2_LOG_PATH;
const ENV = process.env.NODE_ENV;

const myFormat = printf(({ level, message, label, timestamp, ...rest }) => {
  const splat = rest[Symbol.for("splat")]; // 추가 전달 인자 추출

  let socketId = "undefined";
  let memberId = "undefined";

  if (splat && splat.length > 0) {
    const extraObj = splat[0];
    if (extraObj.socketId) socketId = extraObj.socketId;
    if (extraObj.memberId) memberId = extraObj.memberId;
  }

  const levelSegment = `${level}`;
  const leftSegment = `[${socketId}] [Member: ${memberId}]`;

  const levelAligned = levelSegment.padEnd(16, " "); // 고정 길이 16칸으로 설정
  const leftAligned = leftSegment.padEnd(46, " "); // 고정 길이 46칸으로 설정

  return `${timestamp}    ${levelAligned} ${leftAligned}|  ${message}`;
});

// 콘솔 출력용 포맷
const consoleFormat = combine(
  colorize(),
  timestamp({
    format: "YYYY-MM-DD HH:mm:ss:SSS",
  }),
  myFormat
);

// 파일 저장용 포맷
const fileFormat = combine(
  timestamp({
    format: "YYYY-MM-DD HH:mm:ss:SSS",
  }),
  myFormat
);

// 각 환경별 transport 배열 구성
let mainTransports = [];
let exceptionTransports = [];

// 콘솔 transport
const consoleT = new transports.Console({
  level: "debug",
  format: consoleFormat,
});

if (ENV === "dev") {
  // dev: 파일 + 콘솔
  const fileDebugT = new winstonDaily({
    dirname: EC2_LOG_PATH,
    filename: "socket.debug.%DATE%.log",
    datePattern: "YYYY-MM-DD",
    level: "debug",
    maxSize: "10m",
    maxFiles: "7d",
    format: fileFormat,
  });
  mainTransports.push(fileDebugT);

  const fileT = new winstonDaily({
    dirname: EC2_LOG_PATH,
    filename: "socket.info.%DATE%.log",
    datePattern: "YYYY-MM-DD",
    level: "info",
    maxSize: "10m",
    maxFiles: "7d",
    format: fileFormat,
  });
  mainTransports.push(fileT, consoleT);

  const fileErrorT = new winstonDaily({
    dirname: EC2_LOG_PATH,
    filename: "socket.error.%DATE%.log",
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxSize: "10m",
    maxFiles: "7d",
    format: fileFormat,
  });
  exceptionTransports.push(fileErrorT, consoleT);
} else if (ENV === "local") {
  // local: 콘솔만
  mainTransports.push(consoleT);
  exceptionTransports.push(consoleT);
}

// 최종 logger 생성
const logger = createLogger({
  level: "debug",
  defaultMeta: { service: "user-service" },
  transports: mainTransports,
  exceptionHandlers: exceptionTransports,
});

module.exports = { logger: logger };
