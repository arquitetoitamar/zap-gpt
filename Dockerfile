FROM node:16.17.0-bullseye-slim@sha256:18ae6567b623f8c1caada3fefcc8746f8e84ad5c832abd909e129f6b13df25b4
ENV NODE_ENV production
WORKDIR /usr/src/app
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
COPY . /usr/src/app
RUN npm install --force

CMD "node" "index.js"