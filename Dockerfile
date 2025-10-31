FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Clean dev dependencies after build
RUN npm prune --production

EXPOSE 3000

CMD ["npm", "run", "start:prod"]