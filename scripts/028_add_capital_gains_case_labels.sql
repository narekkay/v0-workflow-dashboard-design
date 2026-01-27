-- Add case_labels associations for Plus-values mobilières (Capital Gains)

INSERT INTO case_labels (case_code, sub_category_id)
VALUES
  ('3VG', 29), -- Gains nets de cession
  ('3SG', 30), -- Plus-value avant abattement
  ('3VH', 31)  -- Moins-values nettes
ON CONFLICT (case_code) DO NOTHING;
