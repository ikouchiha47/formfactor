FROM node:21


ENV PORT 9090
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["sh", "-c", "node cmd/server/index.mjs --port=$PORT"]
