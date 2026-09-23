# Unit 6: Docker Deployment Makefile
# Demonstrates: image building, DockerHub tagging, push workflow, and orchestration
# Usage: make build | make tag | make push | make up | make down

DOCKER_USER ?= jeevakumara
IMAGE_SERVER  = time-capsule-server
IMAGE_CLIENT  = time-capsule-client
TAG          ?= latest

.PHONY: build tag push up down restart logs

## Build local Docker images for server and client
build:
	docker build -t $(IMAGE_SERVER):$(TAG) ./server
	docker build -t $(IMAGE_CLIENT):$(TAG) ./client

## Tag local images with DockerHub registry prefix
tag: build
	docker tag $(IMAGE_SERVER):$(TAG) $(DOCKER_USER)/$(IMAGE_SERVER):$(TAG)
	docker tag $(IMAGE_CLIENT):$(TAG) $(DOCKER_USER)/$(IMAGE_CLIENT):$(TAG)

## Push tagged images to DockerHub
## Requires: docker login
push: tag
	docker push $(DOCKER_USER)/$(IMAGE_SERVER):$(TAG)
	docker push $(DOCKER_USER)/$(IMAGE_CLIENT):$(TAG)

## Start all containers in detached mode (docker-compose)
up:
	docker compose up --build -d

## Stop and remove all containers
down:
	docker compose down

## Restart all running containers
restart: down up

## Tail logs from all running containers
logs:
	docker compose logs -f