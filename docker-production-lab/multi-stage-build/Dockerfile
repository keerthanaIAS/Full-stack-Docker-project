FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

COPY --from=builder /app .

CMD ["app.js"]