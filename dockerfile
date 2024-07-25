FROM --platform=linux/amd64 node:14

COPY ./ ./

RUN npm install

CMD ["node", "index.js"]