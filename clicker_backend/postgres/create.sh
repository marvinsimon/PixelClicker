#!/usr/bin/env sh
docker stop clicker_db
docker rm clicker_db
sql=$(cat create_tables.sql)
docker run -d -p 5432:5432 --name clicker_db -e POSTGRES_DB=royal-db -e POSTGRES_PASSWORD=clickerroyale -e POSTGRES_USER=admin postgres:latest postgres
sleep 5
docker exec clicker_db psql -U admin -d royal-db -c "$sql"