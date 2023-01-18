sql=$(cat ./postgres/create_tables.sql)

psql postgresql://admin:clickerroyale@clicker_db:5432/royal-db -c "$sql"

cargo run --release