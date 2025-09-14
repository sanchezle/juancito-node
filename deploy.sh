#!/bin/bash
set -e

# Configuration variables
IMAGE_NAME="juancito-api:latest"
CONTAINER_NAME="juancito-api"
HOST_PORT=5006
CONTAINER_PORT=5000
REGISTRY_URL="localhost:5000"
API_KEY_PATH="./.env"

# Display info
echo "--------------------------------------------"
echo "Deploying Juancito API to Docker"
echo "--------------------------------------------"
echo "Image: $IMAGE_NAME"
echo "Container: $CONTAINER_NAME"
echo "Port Mapping: $HOST_PORT:$CONTAINER_PORT"
echo "--------------------------------------------"

# Pull latest code (if deploying from repository)
echo "Pulling latest code..."
git pull

# Build the Docker image
echo "Building Docker image..."
docker build --no-cache -t $IMAGE_NAME .

# Optional: Push to local registry
if [ "$1" == "--push-registry" ]; then
  echo "Pushing to local registry at $REGISTRY_URL..."
  docker tag $IMAGE_NAME $REGISTRY_URL/$IMAGE_NAME
  docker push $REGISTRY_URL/$IMAGE_NAME
fi

# Stop and remove existing container if running
echo "Stopping existing container (if running)..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Run the new container
echo "Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $HOST_PORT:$CONTAINER_PORT \
  --restart unless-stopped \
  --env-file $API_KEY_PATH \
  -e NODE_ENV=production \
  -e PORT=$CONTAINER_PORT \
  -e CORS_ORIGIN=https://zingy-baklava-d1f0ae.netlify.app \
  --health-cmd="node /app/healthcheck.js" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  $IMAGE_NAME

# Check deployment
echo "--------------------------------------------"
echo "Deployment complete!"
echo "Container status:"
docker ps -f name=$CONTAINER_NAME
echo "--------------------------------------------"
echo "Container logs:"
docker logs $CONTAINER_NAME --tail 10
echo "--------------------------------------------"
echo "API is accessible at: https://luis-dev-lab.com/projects/juancito"
echo "--------------------------------------------"