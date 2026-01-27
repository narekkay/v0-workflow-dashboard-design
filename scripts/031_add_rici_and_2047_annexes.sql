-- Add case codes associated with "Annexe 2042 RI CI" and "Annexe 2047"

INSERT INTO case_annexes (case_code, annexe_name)
VALUES
  -- Annexe 2042 RI CI (29 codes)
  ('7DB', 'Annexe 2042 RI CI'),
  ('BDA', 'Annexe 2042 RI CI'),
  ('BDB', 'Annexe 2042 RI CI'),
  ('BDC', 'Annexe 2042 RI CI'),
  ('BDD', 'Annexe 2042 RI CI'),
  ('BDE', 'Annexe 2042 RI CI'),
  ('BDF', 'Annexe 2042 RI CI'),
  ('BDG', 'Annexe 2042 RI CI'),
  ('BDH', 'Annexe 2042 RI CI'),
  ('BDI', 'Annexe 2042 RI CI'),
  ('BDJ', 'Annexe 2042 RI CI'),
  ('BDK', 'Annexe 2042 RI CI'),
  ('BDL', 'Annexe 2042 RI CI'),
  ('BDM', 'Annexe 2042 RI CI'),
  ('BDN', 'Annexe 2042 RI CI'),
  ('BDO', 'Annexe 2042 RI CI'),
  ('BDP', 'Annexe 2042 RI CI'),
  ('BDQ', 'Annexe 2042 RI CI'),
  ('BDR', 'Annexe 2042 RI CI'),
  ('BDS', 'Annexe 2042 RI CI'),
  ('BDT', 'Annexe 2042 RI CI'),
  ('BDU', 'Annexe 2042 RI CI'),
  ('BDV', 'Annexe 2042 RI CI'),
  ('BDW', 'Annexe 2042 RI CI'),
  ('BDX', 'Annexe 2042 RI CI'),
  ('BDY', 'Annexe 2042 RI CI'),
  ('BDZ', 'Annexe 2042 RI CI'),
  ('BEA', 'Annexe 2042 RI CI'),
  ('7DR', 'Annexe 2042 RI CI'),
  
  -- Annexe 2047 (1 code)
  ('8TK', 'Annexe 2047')
ON CONFLICT (case_code) DO NOTHING;
