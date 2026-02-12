-- Scale table: one record per user per type (fixa/provisoria)
CREATE TABLE IF NOT EXISTS public.scale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'fixa' CHECK (tipo IN ('fixa', 'provisoria')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tipo)
);

ALTER TABLE public.scale ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scale_select" ON public.scale
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "scale_manage_lideranca" ON public.scale
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Scale day table: one record per day of week per scale
CREATE TABLE IF NOT EXISTS public.scale_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id UUID NOT NULL REFERENCES public.scale(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  setor TEXT NOT NULL,
  turno_id UUID NOT NULL REFERENCES public.shifts(id),
  UNIQUE(scale_id, dia_semana)
);

ALTER TABLE public.scale_day ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scale_day_select" ON public.scale_day
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "scale_day_manage_lideranca" ON public.scale_day
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );
