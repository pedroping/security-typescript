FROM node:20-alpine AS build
WORKDIR /app/src

COPY package*.json ./
RUN npm i && npm i ts-node typescript

COPY . ./
RUN npm run build:front

FROM node:20-alpine
WORKDIR /usr/app

COPY --from=build /app/src /usr/app

EXPOSE 80

CMD ["npx", "ts-node", "./src/ssr-entry.ts"]
