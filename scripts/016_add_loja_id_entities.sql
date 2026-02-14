-- Add loja_id column to all entity tables for store-based data isolation

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.task_submissions ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.challenge_scores ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.fixed_schedule ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.temporary_schedule ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.scale_days ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);

-- Backfill existing rows with loja 71 (first store)
DO $$
DECLARE
  loja71_id UUID;
BEGIN
  SELECT id INTO loja71_id FROM public.lojas WHERE numero_loja = '71' LIMIT 1;

  IF loja71_id IS NOT NULL THEN
    UPDATE public.tasks SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.task_submissions SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.challenges SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.challenge_scores SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.calendar_events SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.fixed_schedule SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.temporary_schedule SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.scale_days SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.announcements SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.shifts SET loja_id = loja71_id WHERE loja_id IS NULL;
    UPDATE public.profiles SET loja_id = loja71_id WHERE loja_id IS NULL;
  END IF;
END;
$$;
