-- Add annexe associations for case codes 5KA and 5KB

INSERT INTO case_annexes (case_code, annexe_name)
VALUES 
  ('5KA', 'Annexe 2139'),
  ('5KB', 'Annexe 2139')
ON CONFLICT (case_code) DO NOTHING;
