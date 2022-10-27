DROP TABLE IF EXISTS Player;
CREATE DOMAIN email AS text
    CHECK ( value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$' );
CREATE TABLE  Player (
    id BIGSERIAL PRIMARY KEY,
    password text NOT NULL,
    email text NOT NULL,
    game_state json NOT NULL
);
