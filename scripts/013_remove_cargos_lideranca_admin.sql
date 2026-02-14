-- Remove cargos liderança, admin e embaixador
-- Mantém apenas: assistente, supervisão, gerente

-- 1. Atualizar CHECK constraint em profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_cargo_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_cargo_check 
  CHECK (cargo IN ('assistente', 'supervisão', 'gerente'));

-- 2. Atualizar todas as políticas RLS que usam 'lideranca' ou 'admin'
-- Substituir por 'gerente' ou 'supervisão'

-- Tasks policies
DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    atribuido_para = auth.uid()
    OR criado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "tasks_insert_lideranca" ON public.tasks;
CREATE POLICY "tasks_insert_lideranca" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE TO authenticated USING (
    atribuido_para = auth.uid()
    OR criado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "tasks_delete_lideranca" ON public.tasks;
CREATE POLICY "tasks_delete_lideranca" ON public.tasks
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Task submissions policies
DROP POLICY IF EXISTS "submissions_select" ON public.task_submissions;
CREATE POLICY "submissions_select" ON public.task_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_submissions.task_id
      AND (
        tasks.atribuido_para = auth.uid()
        OR tasks.criado_por = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND cargo IN ('gerente', 'supervisão')
        )
      )
    )
  );

DROP POLICY IF EXISTS "submissions_update_lideranca" ON public.task_submissions;
CREATE POLICY "submissions_update_lideranca" ON public.task_submissions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Calendar events policies
DROP POLICY IF EXISTS "events_insert_lideranca" ON public.calendar_events;
CREATE POLICY "events_insert_lideranca" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "events_update_lideranca" ON public.calendar_events;
CREATE POLICY "events_update_lideranca" ON public.calendar_events
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "events_delete_lideranca" ON public.calendar_events;
CREATE POLICY "events_delete_lideranca" ON public.calendar_events
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Challenges policies
DROP POLICY IF EXISTS "challenges_insert_lideranca" ON public.challenges;
CREATE POLICY "challenges_insert_lideranca" ON public.challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "challenges_update_lideranca" ON public.challenges;
CREATE POLICY "challenges_update_lideranca" ON public.challenges
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "scores_insert_lideranca" ON public.challenge_scores;
CREATE POLICY "scores_insert_lideranca" ON public.challenge_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "scores_update_lideranca" ON public.challenge_scores;
CREATE POLICY "scores_update_lideranca" ON public.challenge_scores
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Shifts policies
DROP POLICY IF EXISTS "shifts_manage_lideranca" ON public.shifts;
CREATE POLICY "shifts_manage_lideranca" ON public.shifts
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Fixed schedule policies
DROP POLICY IF EXISTS "fixed_schedule_manage_lideranca" ON public.fixed_schedule;
CREATE POLICY "fixed_schedule_manage_lideranca" ON public.fixed_schedule
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Temporary schedule policies
DROP POLICY IF EXISTS "temp_schedule_manage_lideranca" ON public.temporary_schedule;
CREATE POLICY "temp_schedule_manage_lideranca" ON public.temporary_schedule
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Scale days policies
DROP POLICY IF EXISTS "scale_days_manage_lideranca" ON public.scale_days;
CREATE POLICY "scale_days_manage_lideranca" ON public.scale_days
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Announcements policies
DROP POLICY IF EXISTS "announcements_manage" ON public.announcements;
CREATE POLICY "announcements_manage" ON public.announcements
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- Profiles policies
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('gerente', 'supervisão')
    )
  );

-- NOTA: Se houver usuários com cargo 'lideranca', 'admin' ou 'embaixador' no banco,
-- você precisará atualizá-los manualmente antes de rodar este script:
-- UPDATE public.profiles SET cargo = 'supervisão' WHERE cargo IN ('lideranca', 'admin', 'embaixador');
