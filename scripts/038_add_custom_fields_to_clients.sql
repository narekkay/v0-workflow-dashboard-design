-- Add custom_fields column to clients table to store custom key-value pairs
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN clients.custom_fields IS 'Array of custom fields: [{"name": "field_name", "value": "field_value"}]';
