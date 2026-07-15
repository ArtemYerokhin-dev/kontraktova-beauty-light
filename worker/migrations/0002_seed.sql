-- Seed data based on real salon services. Run after 0001_init.sql.

INSERT INTO masters (name, categories, work_start, work_end, days_off) VALUES
  ('Оксана', '["manicure_pedicure"]', '09:00', '18:00', '[0]'),
  ('Ірина', '["brows_permanent","lash_lamination"]', '10:00', '19:00', '[1]'),
  ('Марія', '["manicure_pedicure","lash_lamination"]', '09:00', '17:00', '[0,6]');

-- master ids above are 1=Оксана, 2=Ірина, 3=Марія (fresh DB, autoincrement from 1)

INSERT INTO services (name, category, duration_min, price, master_id) VALUES
  ('Манікюр класичний', 'manicure_pedicure', 60, 450, NULL),
  ('Манікюр апаратний', 'manicure_pedicure', 60, 500, NULL),
  ('Манікюр з покриттям гель-лак', 'manicure_pedicure', 90, 650, NULL),
  ('Педикюр класичний', 'manicure_pedicure', 90, 600, 1),
  ('Педикюр апаратний з покриттям', 'manicure_pedicure', 120, 850, 1),
  ('Зняття гель-лаку', 'manicure_pedicure', 30, 150, NULL),
  ('Корекція + фарбування брів', 'brows_permanent', 30, 350, NULL),
  ('Ламінування брів', 'brows_permanent', 60, 550, 2),
  ('Перманентний макіяж брів (пудрове напилення)', 'brows_permanent', 120, 2500, 2),
  ('Корекція перманентного макіяжу брів', 'brows_permanent', 90, 1200, 2),
  ('Ламінування вій', 'lash_lamination', 60, 600, NULL),
  ('Ламінування вій + фарбування', 'lash_lamination', 75, 750, NULL),
  ('Ботокс для вій', 'lash_lamination', 60, 700, 3);
