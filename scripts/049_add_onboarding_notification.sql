-- Add an onboarding notification example
-- This will create a notification that opens an onboarding tab when clicked

INSERT INTO notifications (
  title,
  content,
  alert_type,
  read_status,
  notification_type,
  related_client_id,
  created_at
)
SELECT
  'Questionnaire complété',
  CONCAT(c.first_name, ' ', c.last_name, ' a rempli le questionnaire d''onboarding'),
  'success',
  false,
  'onboarding_filled',
  c.id,
  NOW() - INTERVAL '30 minutes'
FROM clients c
WHERE c.archived = false
LIMIT 1;
