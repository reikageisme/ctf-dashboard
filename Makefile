.PHONY: help build up down logs restart clean deploy test

help: ## Show this help
	@echo "6h4T 9pT pR0 Dashboard - Make Commands"
	@echo "========================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker compose build

up: ## Start services
	docker compose up -d
	@echo "✅ Services started!"
	@echo "🌐 Dashboard: http://localhost:7000"

down: ## Stop services
	docker compose down

logs: ## View logs
	docker compose logs -f

restart: ## Restart services
	docker compose restart

clean: ## Remove containers and images
	docker compose down -v --rmi all

deploy: ## Deploy (build + up)
	@echo "🚀 Deploying 6h4T 9pT pR0 Dashboard..."
	docker compose down
	docker compose build --no-cache
	docker compose up -d
	@echo "✅ Deployment complete!"
	@echo "🌐 http://localhost:7000"

test: ## Test the build
	docker build -t test-dashboard .
	docker run --rm test-dashboard node -e "console.log('✅ Build test passed')"

status: ## Show service status
	docker compose ps

pull: ## Pull latest images
	docker compose pull

update: pull up ## Update and restart services

health: ## Check service health
	@curl -s http://localhost:7000 > /dev/null && echo "✅ Dashboard is healthy" || echo "❌ Dashboard is not responding"

shell: ## Open shell in dashboard container
	docker compose exec ctf-dashboard sh

rebuild: down build up ## Complete rebuild

prod: ## Production deploy with cache
	docker compose -f docker-compose.yml up -d --build
