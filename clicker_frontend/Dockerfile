FROM node:latest


WORKDIR /clicker_frontend
COPY . .

RUN npm install

ADD "https://www.random.org/cgi-bin/randbyte?nbytes=10&format=h" skipcache

RUN rm -r /clicker_frontend/dist

RUN npm run build