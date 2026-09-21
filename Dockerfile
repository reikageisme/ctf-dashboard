# --- Stage 1: Builder ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm ci

COPY public/app.js ./public/app.js
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy code nguồn
COPY server.js .
COPY public ./public
COPY content ./content
COPY --from=builder /app/public/app.bundle.js ./public/app.bundle.js

# --- Bảo mật: Tạo user quyền hạn chế ---
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Mở port cho Coolify kết nối vào
EXPOSE 7000

# Health check (Giữ nguyên vì rất tốt)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:7000/api/intel', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
