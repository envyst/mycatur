FROM nginx:alpine
COPY game-v2 /usr/share/nginx/html
EXPOSE 80
