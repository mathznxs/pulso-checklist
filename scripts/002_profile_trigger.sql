-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, matricula, nome, cpf, cargo, setor_base)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'matricula', ''),
    COALESCE(new.raw_user_meta_data ->> 'nome', ''),
    COALESCE(new.raw_user_meta_data ->> 'cpf', ''),
    COALESCE(new.raw_user_meta_data ->> 'cargo', 'assistente'),
    COALESCE(new.raw_user_meta_data ->> 'setor_base', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
