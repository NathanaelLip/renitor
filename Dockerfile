FROM node:lts-slim AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:lts-slim AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

EXPOSE 4321

# CMD ["node", "./dist/server/entry.mjs"]
CMD ["sh", "-c", "echo URL is $DATABASE_URL && node ./dist/server/entry.mjs"]
