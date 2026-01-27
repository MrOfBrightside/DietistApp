#!/bin/bash

# Development Setup Script för DietistApp

set -e

echo "🚀 Sätter upp DietistApp för lokal utveckling..."

# Kontrollera Node.js version
echo "📦 Kontrollerar Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ krävs. Du har $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Installera dependencies
echo "📥 Installerar dependencies..."
npm install

# Bygg shared package
echo "🔨 Bygger shared package..."
cd packages/shared
npm run build
cd ../..

# Skapa .env filer om de inte finns
echo "⚙️  Skapar .env filer..."

if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Skapade apps/api/.env"
else
    echo "ℹ️  apps/api/.env finns redan"
fi

if [ ! -f "apps/web/.env" ]; then
    cp apps/web/.env.example apps/web/.env
    echo "✅ Skapade apps/web/.env"
else
    echo "ℹ️  apps/web/.env finns redan"
fi

# Starta PostgreSQL med Docker om den inte redan körs
echo "🐘 Kontrollerar PostgreSQL..."
if ! docker ps | grep -q dietistapp-postgres; then
    echo "Startar PostgreSQL container..."
    docker run -d \
      --name dietistapp-postgres \
      -e POSTGRES_USER=dietistapp \
      -e POSTGRES_PASSWORD=dietistapp_password \
      -e POSTGRES_DB=dietistapp_db \
      -p 5432:5432 \
      postgres:16-alpine

    echo "⏳ Väntar på att PostgreSQL ska starta..."
    sleep 5
    echo "✅ PostgreSQL startad"
else
    echo "✅ PostgreSQL körs redan"
fi

echo ""
echo "✨ Setup klar!"
echo ""
echo "📝 Nästa steg:"
echo "1. Starta backend: cd apps/api && npm run dev"
echo "2. Starta frontend (nytt terminal): cd apps/web && npm run dev"
echo ""
echo "🌐 Backend körs på: http://localhost:3000"
echo "🌐 Frontend körs på: http://localhost:5173"
