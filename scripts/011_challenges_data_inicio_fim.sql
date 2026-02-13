-- Add data_inicio, data_fim, descricao to challenges
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_fim DATE,
  ADD COLUMN IF NOT EXISTS descricao TEXT;
