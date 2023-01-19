FROM rust:latest

RUN apt-get update
RUN apt-get install postgresql-client -y
#RUN apt-get install shell -y

WORKDIR /clicker_backend
COPY . .

RUN cargo run --bin typescript_gen --release


COPY /clicker_proxy/xms-dev.com.key ./cert
COPY /clicker_proxy/xms-dev.com.pem ./cert

ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]
