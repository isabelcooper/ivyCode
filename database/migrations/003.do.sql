CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    value VARCHAR,
    expiry TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 minute'
)