-- Add sample notifications for signed conventions

INSERT INTO notifications (title, content, alert_type, read_status, created_at) VALUES
  (
    'Convention signée',
    'La convention d''honoraires a été signée par Sophie Martin',
    'success',
    false,
    NOW() - INTERVAL '5 minutes'
  ),
  (
    'Convention en attente',
    'Jean Dupont n''a pas encore signé la convention d''honoraires',
    'warning',
    false,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'Erreur de signature',
    'La signature de Marie Lambert a échoué - veuillez renvoyer la convention',
    'error',
    false,
    NOW() - INTERVAL '1 day'
  );
