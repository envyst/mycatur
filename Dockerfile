FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY server ./server
COPY game-v2 ./game-v2
COPY .env ./.env
EXPOSE 3000
CMD ["npm", "start"]
