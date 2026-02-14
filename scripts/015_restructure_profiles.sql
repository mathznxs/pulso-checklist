-- Restructure profiles for Microsoft SSO (NextAuth)
-- 1. Add new columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS microsoft_id TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completo BOOLEAN NOT NULL DEFAULT false;

-- 2. Remove CPF column (no longer used for auth)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cpf;

-- 3. Update cargo constraint: only 'assistente' and 'gerente'
--    First migrate any 'supervisão' users to 'gerente'
UPDATE public.profiles SET cargo = 'gerente' WHERE cargo = 'supervisão';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cargo_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cargo_check
  CHECK (cargo IN ('assistente', 'gerente'));

-- 4. Remove the FK to auth.users and the auto-create trigger
--    since authentication is now handled by NextAuth, not Supabase Auth
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Make profiles.id self-generated for new rows (onboarding creates them)
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 6. Mark existing profiles as onboarding_completo = true (they were already active)
UPDATE public.profiles SET onboarding_completo = true WHERE onboarding_completo = false;
