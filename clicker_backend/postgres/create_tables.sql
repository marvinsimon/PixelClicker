DROP TABLE IF EXISTS Player;
CREATE TABLE Player
(
    id         BIGSERIAL PRIMARY KEY,
    email      text    NOT NULL,
    password   text    NOT NULL,
    game_state JSON    NOT NULL,
    timestamp  BIGINT,
    pvp_score  BIGINT,
    is_online  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE PVP
(
    id        BIGSERIAL PRIMARY KEY,
    id_att    BIGINT NOT NULL,
    id_def    BIGINT NOT NULL,
    loot      FLOAT NOT NULL,
    timestamp BIGINT NOT NULL
);
