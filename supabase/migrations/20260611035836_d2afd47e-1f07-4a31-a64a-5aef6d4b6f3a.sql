-- Add 'viuvo' to the marital_status enum so the profile form can persist widowed users.
-- ALTER TYPE ADD VALUE is non-destructive and idempotent via IF NOT EXISTS.
ALTER TYPE public.marital_status ADD VALUE IF NOT EXISTS 'viuvo';