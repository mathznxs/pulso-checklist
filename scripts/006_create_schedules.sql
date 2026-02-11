-- Shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_select" ON public.shifts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "shifts_manage_lideranca" ON public.shifts
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Fixed schedule table
CREATE TABLE IF NOT EXISTS public.fixed_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  setor TEXT NOT NULL,
  turno_id UUID NOT NULL REFERENCES public.shifts(id),
  dias_semana INTEGER[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.fixed_schedule ENABLE ROW LEVEL SECURITY;

-- Everyone can read schedules
CREATE POLICY "fixed_schedule_select" ON public.fixed_schedule
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "fixed_schedule_manage_lideranca" ON public.fixed_schedule
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Temporary schedule (daily overrides)
CREATE TABLE IF NOT EXISTS public.temporary_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  setor TEXT NOT NULL,
  data DATE NOT NULL,
  turno_id UUID NOT NULL REFERENCES public.shifts(id),
  criado_por UUID NOT NULL REFERENCES public.profiles(id)
);

ALTER TABLE public.temporary_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "temp_schedule_select" ON public.temporary_schedule
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "temp_schedule_manage_lideranca" ON public.temporary_schedule
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID REFERENCES public.profiles(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "announcements_manage" ON public.announcements
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );
