DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    username text PRIMARY KEY,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text NOT NULL,
    join_at timestamp without time zone NOT NULL,
    last_login_at timestamp with time zone
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    from_username text NOT NULL REFERENCES users,
    to_username text NOT NULL REFERENCES users,
    body text NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    read_at timestamp with time zone
);

INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
VALUES
(
    'user1',
    '$2b$12$dqLa9.t5gvA1DIcw1gd4helJY0AAoE6ur2TnlDxY.9Z4N8ZKiSPOq',
    'first',
    'last',
    '123-456-7890',
    current_timestamp,
    null
),
(
    'user2',
    '$2b$12$e.6kcFWOuxU40hxOKx6gO.SwYR4n4o0aI31Mkjql0ARDKOfo5f52C',
    'first',
    'last',
    '123-456-7890',
    current_timestamp,
    null
),
(
    'user3',
    '$2b$12$2CgwCSjykDE7QMCvbxiGrutlVUwguqlc9T4U021Mkm/IilGerrV7S',
    'first',
    'last',
    '123-456-7890',
    current_timestamp,
    null
);

INSERT INTO messages (from_username, to_username, body, sent_at, read_at)
VALUES (
    'user1',
    'user2',
    'message body',
    current_timestamp,
    null
);
