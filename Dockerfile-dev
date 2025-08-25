FROM --platform=linux/amd64 node:18

# 1) OS 패키지 설치(apt-get) 이용해 tzdata 설치
# 2) TZ 환경변수 설정
# 3) /etc/localtime 링크 교체 및 /etc/timezone 파일 생성
ENV TZ=Asia/Seoul
RUN apt-get update && apt-get install -y tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 4) 앱 소스 복사
COPY ./ ./

# 5) 패키지 설치
RUN npm install

ENV NODE_ENV dev

# 6) 실행 명령
CMD ["node", "index.js"]