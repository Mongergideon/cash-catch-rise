-- Update withdrawal_status enum to include processing and approved
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'approved';