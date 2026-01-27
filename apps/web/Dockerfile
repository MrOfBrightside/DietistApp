# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiera root package files
COPY package*.json ./
COPY tsconfig.json ./

# Kopiera workspace packages
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN npm ci

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build frontend
WORKDIR /app/apps/web
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage 2: Production med Nginx
FROM nginx:alpine

# Kopiera byggda filer
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Kopiera nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
