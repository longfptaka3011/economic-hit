FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10.20.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
RUN npm install -g pnpm@10.20.0
ENV NODE_ENV=production
ENV PORT=10000
ENV CLIENT_DIST_DIR=/app/apps/client/dist
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --prod --frozen-lockfile --filter @market-mayhem/server... --ignore-scripts
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/client/dist ./apps/client/dist
USER node
EXPOSE 10000
CMD ["node", "apps/server/dist/server.js"]
