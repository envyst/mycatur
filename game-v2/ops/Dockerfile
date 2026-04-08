FROM node:22-alpine
WORKDIR /app
COPY game-v2/package.json ./package.json
RUN npm install
COPY game-v2/server ./server
COPY game-v2 ./game-v2
COPY game-v2/.env ./.env
EXPOSE 3000
CMD ["npm", "start"]
