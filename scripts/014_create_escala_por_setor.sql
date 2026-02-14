-- Nova tabela escala: modelo centrado no setor
-- Cada registro = um funcionario atribuido a um setor+turno em uma data especifica
CREATE TABLE IF NOT EXISTS public.escala (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id UUID NOT NULL REFERENCES public.setores(id),
  turno_id UUID NOT NULL REFERENCES public.shifts(id),
  funcionario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'fixa' CHECK (tipo IN ('fixa', 'provisoria')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Nao duplicar o mesmo funcionario no mesmo setor/turno/data
  UNIQUE(setor_id, turno_id, funcionario_id, data)
);

-- Indice para buscar escala de uma data
CREATE INDEX IF NOT EXISTS idx_escala_data ON public.escala(data);
-- Indice para buscar escala de um funcionario
CREATE INDEX IF NOT EXISTS idx_escala_funcionario ON public.escala(funcionario_id);
-- Indice para buscar por setor e data
CREATE INDEX IF NOT EXISTS idx_escala_setor_data ON public.escala(setor_id, data);

ALTER TABLE public.escala ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler escala
CREATE POLICY "escala_select" ON public.escala
  FOR SELECT TO authenticated USING (true);

-- Apenas gerente pode gerenciar escala
CREATE POLICY "escala_manage_gerente" ON public.escala
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );
