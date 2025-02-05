# Stage 1: Build Stage
FROM node:latest AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.js ./

# Install dependencies
RUN npm install -g pnpm && pnpm i

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production Stage
#FROM nginx:latest
FROM nginx:1.19.9-alpine

# Other configurations, if needed
RUN apk add --update nodejs nodejs-npm jq
RUN npm i -g pnpm@6.32.3

WORKDIR /app

RUN apk add --no-cache --update musl musl-utils musl-locales 

RUN echo 'export LC_ALL=de_CH.UTF-8' >> /etc/profile.d/locale.sh && \
    sed -i 's|LANG=C.UTF-8|LANG=de_CH.UTF-8|' /etc/profile.d/locale.sh

# Set environment variables for language and encoding
ENV LANG de_CH.UTF-8
ENV LANGUAGE de_CH:de
ENV LC_ALL de_CH.UTF-8

# Copy built files from the build stage to the production image
# COPY --from=build /app/dist /usr/share/nginx/html
COPY *.js ./
COPY *.json ./
COPY src /app/src

RUN pnpm i

COPY --chown=nginx nginx.conf.template /etc/nginx/conf.d/default.conf
COPY rebuild.sh rebuild.sh

# Container startup command for the web server (nginx in this case)
# CMD ["nginx", "-g", "daemon off;"]
CMD './rebuild.sh'
