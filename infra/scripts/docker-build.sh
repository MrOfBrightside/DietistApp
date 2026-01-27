#!/bin/bash

# Build Docker images för DietistApp

set -e

echo "🐳 Bygger Docker images..."

# Gå till root
cd "$(dirname "$0")/../.."

# Bygg API image
echo "🔨 Bygger API image..."
docker build -t dietistapp/api:latest -f apps/api/Dockerfile .
echo "✅ API image byggd"

# Bygg Web image
echo "🔨 Bygger Web image..."
docker build \
  --build-arg VITE_API_URL=http://localhost:3000/api \
  -t dietistapp/web:latest \
  -f apps/web/Dockerfile .
echo "✅ Web image byggd"

echo ""
echo "✨ Alla images byggda!"
echo ""
echo "📝 Använd följande kommandon:"
echo "- Starta med Docker Compose: cd infra/docker && docker-compose up -d"
echo "- Lista images: docker images | grep dietistapp"
