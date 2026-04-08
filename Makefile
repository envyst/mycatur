PROJECT_DIR := $(shell pwd)

.PHONY: help up down restart redeploy ps logs build deploy nginx-sync-pre-certbot nginx-test-reload

help:
	@echo "mycatur commands:"
	@echo "  make up                     # docker compose up -d"
	@echo "  make down                   # docker compose down"
	@echo "  make restart                # docker compose restart"
	@echo "  make redeploy               # docker compose up -d --build --force-recreate"
	@echo "  make ps                     # docker compose ps"
	@echo "  make logs                   # docker compose logs"
	@echo "  make build                  # docker compose build"
	@echo "  make deploy                 # build + recreate container"
	@echo "  make nginx-sync-pre-certbot # install nginx config for mycatur.envyst.asia"
	@echo "  make nginx-test-reload      # nginx -t && systemctl reload nginx"

up:
	@cd $(PROJECT_DIR) && docker compose up -d

down:
	@cd $(PROJECT_DIR) && docker compose down

restart:
	@cd $(PROJECT_DIR) && docker compose restart

redeploy:
	@cd $(PROJECT_DIR) && docker compose up -d --build --force-recreate

ps:
	@cd $(PROJECT_DIR) && docker compose ps

logs:
	@cd $(PROJECT_DIR) && docker compose logs --tail=120

build:
	@cd $(PROJECT_DIR) && docker compose build

deploy: redeploy

nginx-sync-pre-certbot:
	@cp $(PROJECT_DIR)/deploy/nginx.mycatur.envyst.asia.pre-certbot.conf /etc/nginx/sites-available/mycatur.envyst.asia.conf
	@echo "Copied nginx config to /etc/nginx/sites-available/mycatur.envyst.asia.conf"

nginx-test-reload:
	@nginx -t
	@systemctl reload nginx
