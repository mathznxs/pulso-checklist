-- Migrar cargos antigos para os novos dois unicos cargos: assistente e gerente
-- lideranca, admin, supervisao -> gerente
-- embaixador -> assistente (ja eh o padrao, mas por seguranca)

UPDATE public.profiles SET cargo = 'gerente' WHERE cargo IN ('lideranca', 'admin');
UPDATE public.profiles SET cargo = 'assistente' WHERE cargo NOT IN ('assistente', 'gerente');

-- Dropar constraint antiga e criar nova com apenas 2 opcoes
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cargo_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cargo_check CHECK (cargo IN ('assistente', 'gerente'));
