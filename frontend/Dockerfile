FROM node:18-alpine

# 한국 시간대 설정
RUN apk add --no-cache tzdata
ENV TZ=Asia/Seoul

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g next
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
