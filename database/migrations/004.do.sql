CREATE TABLE recommendations (
    title VARCHAR PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users (id),
    category VARCHAR,
    length INTEGER
)
