# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM deps AS builder
WORKDIR /app

ARG NEXT_PUBLIC_BASE_PATH=/AdaCheckStockSTD
ARG NEXT_PUBLIC_BUILD_ID

ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ARG NEXT_PUBLIC_BASE_PATH=/AdaCheckStockSTD

ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/version.txt ./version.txt

RUN mkdir -p /app/.runtime /app/.next/cache \
    && chown -R node:node /app/.runtime /app/.next/cache \
    && chmod 555 /app

USER node

EXPOSE 3001

CMD ["node", "server.js"]
