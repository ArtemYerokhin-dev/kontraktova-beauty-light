-- Per-master PIN for self-service schedule editing (separate from the
-- owner's ADMIN_PASSWORD, which still grants full admin access).
ALTER TABLE masters ADD COLUMN pin TEXT;
