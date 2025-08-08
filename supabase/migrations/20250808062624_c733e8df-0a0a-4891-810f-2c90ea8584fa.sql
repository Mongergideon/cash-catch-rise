-- Update withdrawal_status enum to include 'approved' and 'processing'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'processing' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'withdrawal_status')) THEN
    ALTER TYPE withdrawal_status ADD VALUE 'processing';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'approved' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'withdrawal_status')) THEN
    ALTER TYPE withdrawal_status ADD VALUE 'approved';
  END IF;
END $$;