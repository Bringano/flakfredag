CREATE TABLE IF NOT EXISTS beers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brewery TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tastings (
    id SERIAL PRIMARY KEY,
    beer_id INTEGER NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
    food TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    tasting_id INTEGER NOT NULL REFERENCES tastings(id) ON DELETE CASCADE,
    person TEXT NOT NULL CHECK (person IN ('Adam', 'Emil', 'Victor')),
    score NUMERIC(4,1) NOT NULL CHECK (score >= 1 AND score <= 10)
);

CREATE INDEX IF NOT EXISTS idx_tastings_beer_id ON tastings(beer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_tasting_id ON ratings(tasting_id);
