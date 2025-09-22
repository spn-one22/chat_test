FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --only=production
COPY server.js ./server.js
COPY public ./public
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
