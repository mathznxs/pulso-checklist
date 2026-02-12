-- Add description, start/end dates to challenges table
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS data_fim DATE;
