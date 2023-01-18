FROM rust:latest

RUN apt-get update
RUN apt-get install postgresql-client -y
#RUN apt-get install shell -y

WORKDIR /clicker_backend
COPY . .

ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]
