-- Magazyn JSON-ów witryny: cennik, galeria przed/po, dane kontaktowe.
-- Wzorzec jak site_settings w @moduly/data-store (klucz -> jsonb).
CREATE TABLE IF NOT EXISTS site_blobs (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
