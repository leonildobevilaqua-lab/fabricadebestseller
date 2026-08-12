FROM node:22-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm ci

COPY backend/ ./

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/backend/package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/assets ./assets

EXPOSE 3000

CMD ["npm", "start"]
