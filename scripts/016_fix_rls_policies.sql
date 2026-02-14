-- Atualizar TODAS as RLS policies para usar apenas cargo = 'gerente'
-- em vez de cargo IN ('lideranca', 'gerente', 'admin')

-- =============================================
-- PROFILES
-- =============================================
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- TASKS
-- =============================================
DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT TO authenticated USING (
    atribuido_para = auth.uid()
    OR criado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

DROP POLICY IF EXISTS "tasks_insert_lideranca" ON public.tasks;
CREATE POLICY "tasks_insert_lideranca" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
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
      AND cargo = 'gerente'
    )
  );

DROP POLICY IF EXISTS "tasks_delete_lideranca" ON public.tasks;
CREATE POLICY "tasks_delete_lideranca" ON public.tasks
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- TASK SUBMISSIONS
-- =============================================
DROP POLICY IF EXISTS "submissions_select" ON public.task_submissions;
CREATE POLICY "submissions_select" ON public.task_submissions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_submissions.task_id
      AND (
        tasks.atribuido_para = auth.uid()
        OR tasks.criado_por = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND cargo = 'gerente'
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
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- SHIFTS
-- =============================================
DROP POLICY IF EXISTS "shifts_manage_lideranca" ON public.shifts;
CREATE POLICY "shifts_manage_lideranca" ON public.shifts
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- FIXED SCHEDULE (tabela antiga, mantida por seguranca)
-- =============================================
DROP POLICY IF EXISTS "fixed_schedule_manage_lideranca" ON public.fixed_schedule;
CREATE POLICY "fixed_schedule_manage_lideranca" ON public.fixed_schedule
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- TEMPORARY SCHEDULE (tabela antiga, mantida por seguranca)
-- =============================================
DROP POLICY IF EXISTS "temp_schedule_manage_lideranca" ON public.temporary_schedule;
CREATE POLICY "temp_schedule_manage_lideranca" ON public.temporary_schedule
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- ANNOUNCEMENTS
-- =============================================
DROP POLICY IF EXISTS "announcements_manage" ON public.announcements;
CREATE POLICY "announcements_manage" ON public.announcements
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- CALENDAR EVENTS
-- =============================================
DROP POLICY IF EXISTS "calendar_events_insert" ON public.calendar_events;
CREATE POLICY "calendar_events_insert" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

DROP POLICY IF EXISTS "calendar_events_update" ON public.calendar_events;
CREATE POLICY "calendar_events_update" ON public.calendar_events
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

DROP POLICY IF EXISTS "calendar_events_delete" ON public.calendar_events;
CREATE POLICY "calendar_events_delete" ON public.calendar_events
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- CHALLENGES
-- =============================================
DROP POLICY IF EXISTS "challenges_insert_lideranca" ON public.challenges;
CREATE POLICY "challenges_insert_lideranca" ON public.challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

DROP POLICY IF EXISTS "challenges_update_lideranca" ON public.challenges;
CREATE POLICY "challenges_update_lideranca" ON public.challenges
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- CHALLENGE SCORES
-- =============================================
DROP POLICY IF EXISTS "scores_insert_lideranca" ON public.challenge_scores;
CREATE POLICY "scores_insert_lideranca" ON public.challenge_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

DROP POLICY IF EXISTS "scores_update_lideranca" ON public.challenge_scores;
CREATE POLICY "scores_update_lideranca" ON public.challenge_scores
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );

-- =============================================
-- SCALE DAYS (tabela antiga, mantida por seguranca)
-- =============================================
DROP POLICY IF EXISTS "scale_days_manage_lideranca" ON public.scale_days;
CREATE POLICY "scale_days_manage_lideranca" ON public.scale_days
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo = 'gerente'
    )
  );
