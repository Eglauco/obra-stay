# ---- Build ----
# Debian (glibc) evita problemas com binários nativos (tailwind oxide / lightningcss)
FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Apenas dependências de produção para rodar o servidor SSR
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
# Saída do build (dist/front/{browser,server})
COPY --from=build /app/dist ./dist
# O servidor Angular SSR escuta em process.env.PORT (injetado pelo Railway)
EXPOSE 4000
CMD ["node", "dist/front/server/server.mjs"]
