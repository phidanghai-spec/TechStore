# Stage 1: Build TypeScript backend
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
# Only install production dependencies
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client in production environment
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "start"]
