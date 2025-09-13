# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources
COPY . .

# Accept VITE_* at build time (optional)
ARG VITE_TELEGRAM_BOT_TOKEN
ARG VITE_TELEGRAM_CHAT_ID
ENV VITE_TELEGRAM_BOT_TOKEN=${VITE_TELEGRAM_BOT_TOKEN}
ENV VITE_TELEGRAM_CHAT_ID=${VITE_TELEGRAM_CHAT_ID}

# Build
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.28-alpine AS serve

# Copy Nginx config with SPA fallback and /telegram proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
