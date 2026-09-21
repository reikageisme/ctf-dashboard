#!/bin/bash
# Quick build and push to GitHub Container Registry

set -e

echo "🐳 Building Docker image for 6h4T 9pT pR0 Dashboard"
echo "===================================================="

# Variables
GITHUB_USER="sudo-baoz"
IMAGE_NAME="ctf-dashboard"
FULL_IMAGE="ghcr.io/${GITHUB_USER}/${IMAGE_NAME}"

# Build
echo "📦 Building image: ${FULL_IMAGE}:latest"
docker build -t ${FULL_IMAGE}:latest .

# Tag with date
DATE_TAG=$(date +%Y%m%d)
docker tag ${FULL_IMAGE}:latest ${FULL_IMAGE}:${DATE_TAG}

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Available tags:"
echo "   - ${FULL_IMAGE}:latest"
echo "   - ${FULL_IMAGE}:${DATE_TAG}"
echo ""
echo "🚀 To push to GitHub:"
echo "   1. Login: echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u ${GITHUB_USER} --password-stdin"
echo "   2. Push:  docker push ${FULL_IMAGE}:latest"
echo "   3. Push:  docker push ${FULL_IMAGE}:${DATE_TAG}"
echo ""
echo "Or run: ./push-to-github.sh"
