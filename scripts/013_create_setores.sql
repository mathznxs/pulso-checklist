-- Tabela setores: fonte unica de verdade para setores da loja
CREATE TABLE IF NOT EXISTS public.setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  cor TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler setores
CREATE POLICY "setores_select" ON public.setores
  FOR SELECT TO authenticated USING (true);

-- Apenas gerente pode gerenciar setores
CREATE POLICY "setores_manage_gerente" ON public.setores
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- Seed dos 8 setores obrigatorios com cores
INSERT INTO public.setores (nome, cor) VALUES
  ('Anfitriao', '#90EE90'),
  ('Masculino', '#F5DEB3'),
  ('Feminino', '#ADD8E6'),
  ('Futebol', '#228B22'),
  ('Caixa', '#FFA07A'),
  ('Ilha', '#4169E1'),
  ('OMS', '#C0C0C0'),
  ('Provador', '#FFD700')
ON CONFLICT (nome) DO NOTHING;
