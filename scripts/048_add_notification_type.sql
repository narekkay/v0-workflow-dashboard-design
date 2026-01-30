-- Add notification_type column to handle click actions and redirects
ALTER TABLE notifications 
ADD COLUMN notification_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN related_client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: general, onboarding_filled, convention_signed, etc.';
COMMENT ON COLUMN notifications.related_client_id IS 'Optional client ID for context-specific notifications';

-- Create index for performance
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_client ON notifications(related_client_id);
