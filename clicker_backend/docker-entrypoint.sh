sql=$(cat ./postgres/create_tables.sql)

psql postgresql://admin:clickerroyale@clicker-db:5432/royal-db -c "$sql"

cargo build
cargo run