-- Profiles table: extends auth.users with Centauro-specific fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  matricula TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT 'assistente' CHECK (cargo IN ('assistente', 'lideranca', 'gerente', 'admin')),
  setor_base TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read profiles
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Users can update their own profile (limited)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Lideranca/gerente/admin can insert profiles (for admin creating users)
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Admin/gerente can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'admin')
    )
  );
