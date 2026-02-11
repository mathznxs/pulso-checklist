-- Fix tasks SELECT policy to allow lideranca/gerente/admin to see all tasks
-- and assistentes to only see their own tasks
DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;

CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    atribuido_para = auth.uid()
    OR criado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Fix task_submissions SELECT to allow lideranca to see all
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
          AND cargo IN ('lideranca', 'gerente', 'admin')
        )
      )
    )
  );

-- Fix submissions_update_lideranca to work properly
DROP POLICY IF EXISTS "submissions_update_lideranca" ON public.task_submissions;

CREATE POLICY "submissions_update_lideranca" ON public.task_submissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Fix tasks UPDATE policy - assistente can update own, lideranca can update all
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    atribuido_para = auth.uid()
    OR criado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );
