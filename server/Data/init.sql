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

-- Loggbok: kvällar ni träffats (oberoende av öl-provningarna ovan), med bilder.
CREATE TABLE IF NOT EXISTS gatherings (
    id SERIAL PRIMARY KEY,
    occurred_on DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bilderna lagras direkt i databasen (BYTEA) istället för på disk: appen körs
-- på Render där webbtjänstens filsystem inte är beständigt mellan omstarter,
-- medan databasen är det. Klienten komprimerar bilder innan uppladdning för
-- att hålla nere storleken.
CREATE TABLE IF NOT EXISTS gathering_photos (
    id SERIAL PRIMARY KEY,
    gathering_id INTEGER NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gathering_photos_gathering_id ON gathering_photos(gathering_id);
