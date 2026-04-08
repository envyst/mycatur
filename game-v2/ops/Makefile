PROJECT_DIR := $(shell pwd)
COMPOSE := docker compose -f $(PROJECT_DIR)/game-v2/ops/docker-compose.yml

.PHONY: help up down restart redeploy ps logs db-logs build deploy nginx-sync-pre-certbot nginx-test-reload

help:
	@echo "mycatur commands:"
	@echo "  make up                     # docker compose up -d"
	@echo "  make down                   # docker compose down"
	@echo "  make restart                # docker compose restart"
	@echo "  make redeploy               # docker compose up -d --build --force-recreate"
	@echo "  make ps                     # docker compose ps"
	@echo "  make logs                   # app logs"
	@echo "  make db-logs                # database logs"
	@echo "  make build                  # docker compose build"
	@echo "  make deploy                 # build + recreate containers"
	@echo "  make nginx-sync-pre-certbot # install nginx config for mycatur.envyst.asia"
	@echo "  make nginx-test-reload      # nginx -t && systemctl reload nginx"

up:
	@cd $(PROJECT_DIR) && $(COMPOSE) up -d

down:
	@cd $(PROJECT_DIR) && $(COMPOSE) down

restart:
	@cd $(PROJECT_DIR) && $(COMPOSE) restart

redeploy:
	@cd $(PROJECT_DIR) && $(COMPOSE) up -d --build --force-recreate

ps:
	@cd $(PROJECT_DIR) && $(COMPOSE) ps

logs:
	@cd $(PROJECT_DIR) && $(COMPOSE) logs --tail=120 mycatur

db-logs:
	@cd $(PROJECT_DIR) && $(COMPOSE) logs --tail=120 db

build:
	@cd $(PROJECT_DIR) && $(COMPOSE) build

deploy: redeploy

nginx-sync-pre-certbot:
	@cp $(PROJECT_DIR)/game-v2/ops/deploy/nginx.mycatur.envyst.asia.pre-certbot.conf /etc/nginx/sites-available/mycatur.envyst.asia.conf
	@echo "Copied nginx config to /etc/nginx/sites-available/mycatur.envyst.asia.conf"

nginx-test-reload:
	@nginx -t
	@systemctl reload nginx
