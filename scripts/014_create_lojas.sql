-- Create lojas (stores) table for multi-tenant isolation
CREATE TABLE IF NOT EXISTS public.lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_loja TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial store
INSERT INTO public.lojas (numero_loja, nome, ativo)
VALUES ('71', 'Loja 71', true)
ON CONFLICT (numero_loja) DO NOTHING;
