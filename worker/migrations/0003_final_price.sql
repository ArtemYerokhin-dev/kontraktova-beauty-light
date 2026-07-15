-- Actual price charged for a booking, set/edited by admin after the visit.
-- Client-facing price shown before this is set is only an estimate.
ALTER TABLE bookings ADD COLUMN final_price INTEGER;
