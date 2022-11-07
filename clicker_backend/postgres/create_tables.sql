CREATE TABLE Player
(
    id         BIGSERIAL PRIMARY KEY,
    email      text NOT NULL,
    password   text NOT NULL,
    game_state JSON NOT NULL
);
