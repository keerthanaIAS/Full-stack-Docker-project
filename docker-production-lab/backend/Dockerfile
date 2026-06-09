FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

HEALTHCHECK --interval=10s \
            --timeout=3s \
            --retries=3 \
CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm","start"]