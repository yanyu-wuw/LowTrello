# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS build
WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmjs.org
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=$HTTP_PROXY \
	HTTPS_PROXY=$HTTPS_PROXY \
	NO_PROXY=$NO_PROXY

COPY package.json package-lock.json ./
RUN npm config set registry ${NPM_REGISTRY} \
	&& if [ -n "$HTTP_PROXY" ]; then npm config set proxy "$HTTP_PROXY"; fi \
	&& if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy "$HTTPS_PROXY"; fi \
	&& npm config set fetch-retries 5 \
	&& npm config set fetch-retry-mintimeout 20000 \
	&& npm config set fetch-retry-maxtimeout 120000 \
	&& npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
