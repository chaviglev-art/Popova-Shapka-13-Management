-- ============================================================
-- Popova Shapka 13 — starting data
-- Run AFTER schema.sql. Safe to re-run (on conflict do nothing).
-- Creates the 15 apartments, 1 room and 7 garages, plus the emergency contact.
-- Payments/expenses/news/etc. are left empty — add them from the app once it's live.
-- ============================================================

insert into units (id, num, type, floor, size, owner, fee) values
  ('apt1','1','apartment',1,55,'Owner 1',40),
  ('apt2','2','apartment',1,62,'Owner 2',40),
  ('apt3','3','apartment',1,48,'Owner 3',40),
  ('apt4','4','apartment',2,70,'Owner 4',40),
  ('apt5','5','apartment',2,80,'Owner 5',40),
  ('apt6','6','apartment',2,55,'Owner 6',40),
  ('apt7','7','apartment',3,62,'Owner 7',40),
  ('apt8','8','apartment',3,48,'Owner 8',40),
  ('apt9','9','apartment',3,70,'Owner 9',40),
  ('apt10','10','apartment',4,80,'Owner 10',40),
  ('apt11','11','apartment',4,55,'Owner 11',40),
  ('apt12','12','apartment',4,62,'Owner 12',40),
  ('apt13','13','apartment',5,48,'Owner 13',40),
  ('apt14','14','apartment',5,70,'Owner 14',40),
  ('apt15','15','apartment',5,80,'Owner 15',40),
  ('room1','R1','room',0,25,'Room tenant',25),
  ('gar1','G1','garage',-1,14,'Owner 1',15),
  ('gar2','G2','garage',-1,14,'Owner 2',15),
  ('gar3','G3','garage',-1,14,'Owner 3',15),
  ('gar4','G4','garage',-1,14,'Owner 4',15),
  ('gar5','G5','garage',-1,14,'Owner 5',15),
  ('gar6','G6','garage',-1,14,'Owner 6',15),
  ('gar7','G7','garage',-1,14,'Owner 7',15)
on conflict (id) do nothing;

insert into contacts (id, role, name, phone) values
  ('c1','emergency','Emergency','112')
on conflict (id) do nothing;

update building set
  name = 'Попова шапка 13',
  address = 'ул. „Попова шапка“ 13, 1505 София',
  currency = 'EUR',
  show_dual = true,
  default_fee = 40,
  opening_balance = 0
where id = 1;
