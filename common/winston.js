const util = require("util");
const { format, createLogger, transports } = require("winston"); // 로그 처리 모듈
const { combine, colorize, timestamp, printf, padLevels } = format;
var winstonDaily = require("winston-daily-rotate-file"); // 로그 일별 처리 모듈

const myFormat = printf(({ level, message, label, timestamp, ...rest }) => {
  const splat = rest[Symbol.for("splat")];
  const strArgs = splat ? splat.map((s) => util.formatWithOptions({ colors: true, depth: 10 }, s)).join(" ") : "";
  return `${timestamp}  ${level}  ${util.formatWithOptions({ colors: true, depth: 10 }, message)} ${strArgs}`;
});

const logger = createLogger({
  level: "info",
  format: combine(
    colorize(),
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss:SSS",
    }),
    padLevels(),
    myFormat
  ),
  defaultMeta: { service: "user-service" },

  transports: [
    new winstonDaily({
      // 로그 파일 설정
      name: "info-file",
      filename: `./logs/3000_%DATE%.log`, // 파일 이름 (아래 설정한 날짜 형식이 %DATE% 위치에 들어간다)
      datePattern: "YYYY-MM-DD", // 날짜 형식 (대문자여야 적용된다.)
      colorize: false,
      maxsize: 50000000, // 로그 파일 하나의 용량 제한
      maxFiles: 1000, // 로그 파일 개수 제한
      zippedArchive: true,
    }),
    new transports.Console({ level: "debug" }),
  ],
  exceptionHandlers: [
    new winstonDaily({
      // 로그 파일 설정
      name: "error-file",
      filename: `./logs/3000_exception_%DATE%.log`, // 파일 이름 (아래 설정한 날짜 형식이 %DATE% 위치에 들어간다)
      datePattern: "YYYY-MM-DD", // 날짜 형식 (대문자여야 적용된다.)
      colorize: false,
      maxsize: 50000000, // 로그 파일 하나의 용량 제한
      maxFiles: 1000, // 로그 파일 개수 제한
      level: "error", // info이상 파일 출력                      // 로그 레벨 지정
      zippedArchive: true,
      showLevel: true,
    }),
    ,
    new transports.Console(),
  ],
});

// if (process.env.NODE_ENV !== 'production') {

//         logger.add(new transports.Console({
//             format: format.printf( info => `${new Date().toFormat('YYYY-MM-DD HH24:MI:SS')} [${info.level.toUpperCase()}] - ${info.message}`),
//         }));

// }

const stream = {
  write: (message) => {
    logger.info(message.substring(0, message.lastIndexOf("\n")));
  },
};

module.exports = logger;
module.exports.stream = stream;
