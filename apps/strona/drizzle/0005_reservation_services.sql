-- Rezerwacje z usługami z cennika: migawka pozycji (jsonb), łączny czas pracy
-- i wyliczony moment odbioru auta (praca może przelać się na kolejny dzień).
-- Stare wiersze: services=[] i duration_minutes=0 → scheduler traktuje je
-- jak jeden slot (zachowanie sprzed zmiany).
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS duration_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_date DATE,
  ADD COLUMN IF NOT EXISTS pickup_time TEXT;
