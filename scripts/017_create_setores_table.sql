-- 017: Create setores table as single source of truth for sectors
-- Replaces hardcoded SETORES arrays and profiles.setor_base derived lists

CREATE TABLE IF NOT EXISTS public.setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  cor TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read setores
CREATE POLICY "setores_select_authenticated"
  ON public.setores
  FOR SELECT
  TO authenticated
  USING (true);

-- Only gerente can manage setores
CREATE POLICY "setores_manage_gerente"
  ON public.setores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.cargo = 'gerente'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.cargo = 'gerente'
    )
  );

-- Seed the 8 mandatory sectors
INSERT INTO public.setores (nome, cor) VALUES
  ('Anfitriao', '#86efac'),
  ('Masculino', '#fde68a'),
  ('Feminino', '#93c5fd'),
  ('Futebol', '#4ade80'),
  ('Caixa', '#fca5a5'),
  ('Ilha', '#60a5fa'),
  ('OMS', '#d1d5db'),
  ('Provador', '#fde047')
ON CONFLICT (nome) DO NOTHING;
