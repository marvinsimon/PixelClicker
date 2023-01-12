DROP TABLE IF EXISTS Player;
CREATE TABLE Player
(
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT    NOT NULL,
    password      TEXT    NOT NULL,
    username      TEXT    NOT NULL,
    game_state    JSON    NOT NULL,
    timestamp     BIGINT,
    pvp_score     BIGINT,
    is_online     BOOLEAN NOT NULL DEFAULT false,
    is_new        BOOLEAN NOT NULL DEFAULT true,
    offline_ore   BIGINT  NOT NULL DEFAULT 0,
    offline_depth BIGINT  NOT NULL DEFAULT 0
);

CREATE TABLE PVP
(
    id        BIGSERIAL PRIMARY KEY,
    id_att    BIGINT NOT NULL,
    id_def    BIGINT NOT NULL,
    loot      FLOAT  NOT NULL,
    timestamp BIGINT NOT NULL
);

CREATE TYPE event_type AS ENUM ('daily', 'weekly', 'seasonal');

CREATE TABLE Event
(
    id             BIGSERIAL PRIMARY KEY,
    event_text     TEXT       NOT NULL,
    classification event_type NOT NULL
);


-- This table needs to be deleted in a daily cron job and reinitialized
CREATE TABLE Player_Event
(
    id        BIGSERIAL PRIMARY KEY,
    id_event  BIGINT NOT NULL,
    id_player BIGINT NOT NULL,
    finished  BOOLEAN DEFAULT false,
    "date"    DATE    DEFAULT current_date
);