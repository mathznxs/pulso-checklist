-- Calendar events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'evento' CHECK (tipo IN ('evento', 'visita', 'lancamento', 'folga', 'critico')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  criado_por UUID NOT NULL REFERENCES public.profiles(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read events
CREATE POLICY "calendar_events_select" ON public.calendar_events
  FOR SELECT TO authenticated USING (true);

-- Lideranca+ can create events
CREATE POLICY "calendar_events_insert" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Lideranca+ can update events
CREATE POLICY "calendar_events_update" ON public.calendar_events
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Lideranca+ can delete events
CREATE POLICY "calendar_events_delete" ON public.calendar_events
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );
