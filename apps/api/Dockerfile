# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiera root package files
COPY package*.json ./
COPY tsconfig.json ./

# Kopiera workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN npm ci

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build API
WORKDIR /app/apps/api
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Kopiera endast produktions-dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Kopiera byggda filer från builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]
