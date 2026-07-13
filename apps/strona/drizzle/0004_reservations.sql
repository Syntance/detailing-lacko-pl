-- Rezerwacje online. Slot = (date, time). Odrzucone zwalniają slot,
-- dlatego unikalność dotyczy tylko rezerwacji aktywnych (nowa/potwierdzona).
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'nowa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations(date);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status);

-- Anty-dubel: jeden aktywny wpis na slot (odrzucone nie blokują).
CREATE UNIQUE INDEX IF NOT EXISTS reservations_active_slot_unique
  ON reservations(date, time)
  WHERE status <> 'odrzucona';
