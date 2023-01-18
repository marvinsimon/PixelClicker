sql=$(cat ./postgres/create_tables.sql)


sleep 5s

psql postgresql://admin:clickerroyale@clicker_db:5432/royal-db -c "$sql"

cargo build
cargo run