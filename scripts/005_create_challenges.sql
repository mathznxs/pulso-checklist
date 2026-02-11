-- Challenges (gincanas) table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select" ON public.challenges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "challenges_insert_lideranca" ON public.challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

CREATE POLICY "challenges_update_lideranca" ON public.challenges
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Challenge scores table
CREATE TABLE IF NOT EXISTS public.challenge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_select" ON public.challenge_scores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "scores_insert_lideranca" ON public.challenge_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

CREATE POLICY "scores_update_lideranca" ON public.challenge_scores
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );
