-- Id wydarzenia w Kalendarzu Google utworzonego dla rezerwacji. Pozwala je
-- usunąć, gdy właściciel odrzuci albo skasuje rezerwację w panelu (inaczej
-- termin zostałby zablokowany w kalendarzu na zawsze).
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;
