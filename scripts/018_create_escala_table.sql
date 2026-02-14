-- 018: Create escala table - new schedule model organized by setor
-- Each row = one employee assigned to one shift in one sector

CREATE TABLE IF NOT EXISTS public.escala (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE,                -- non-null for provisoria (specific date)
  dia_semana SMALLINT,      -- 0=Sunday..6=Saturday, non-null for fixa
  tipo TEXT NOT NULL CHECK (tipo IN ('fixa', 'provisoria')),
  loja_id UUID REFERENCES public.lojas(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT now(),

  -- Constraints: provisoria must have data, fixa must have dia_semana
  CONSTRAINT escala_provisoria_data CHECK (
    tipo != 'provisoria' OR data IS NOT NULL
  ),
  CONSTRAINT escala_fixa_dia_semana CHECK (
    tipo != 'fixa' OR (dia_semana IS NOT NULL AND dia_semana BETWEEN 0 AND 6)
  ),
  -- Prevent duplicate: same sector + shift + date (provisoria)
  CONSTRAINT escala_unique_provisoria UNIQUE (setor_id, turno_id, data),
  -- Prevent duplicate: same sector + shift + weekday (fixa)
  CONSTRAINT escala_unique_fixa UNIQUE (setor_id, turno_id, dia_semana)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_escala_data ON public.escala(data);
CREATE INDEX IF NOT EXISTS idx_escala_dia_semana ON public.escala(dia_semana);
CREATE INDEX IF NOT EXISTS idx_escala_funcionario ON public.escala(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_escala_setor ON public.escala(setor_id);

-- Enable RLS
ALTER TABLE public.escala ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read escala
CREATE POLICY "escala_select_authenticated"
  ON public.escala
  FOR SELECT
  TO authenticated
  USING (true);

-- Only gerente can manage escala
CREATE POLICY "escala_manage_gerente"
  ON public.escala
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
