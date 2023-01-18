FROM rust:latest

RUN apt-get update
RUN apt-get install postgresql-client -y
#RUN apt-get install shell -y

WORKDIR /clicker_backend
COPY . .

RUN cargo run --bin typescript_gen --release

ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]
