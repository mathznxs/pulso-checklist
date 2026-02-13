-- Escala semanal: um setor por dia por usuário (constraint única)
CREATE TABLE IF NOT EXISTS public.scale_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  setor TEXT,
  turno_id UUID REFERENCES public.shifts(id),
  UNIQUE(profile_id, dia_semana)
);

CREATE INDEX IF NOT EXISTS idx_scale_days_profile ON public.scale_days(profile_id);

ALTER TABLE public.scale_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scale_days_select" ON public.scale_days
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "scale_days_manage_lideranca" ON public.scale_days
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );
