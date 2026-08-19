# Build the site, then serve it from nginx alongside a proxy to the API.
#
# Serving the SPA and the API from one origin is not just convenience: the application uses a
# session cookie with SameSite=Lax, which a browser will not send on cross-site requests. This
# mirrors how production runs behind Caddy.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy_headers.conf /etc/nginx/proxy_headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
