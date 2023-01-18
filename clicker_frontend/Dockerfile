FROM node:latest


WORKDIR /clicker_frontend
COPY . .

RUN npm install

ENTRYPOINT [ "npm", "run", "build"]