FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

COPY . .

RUN yarn build

FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs
USER nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nextjs /app/public ./public

ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000

CMD ["node", "server.js"]
