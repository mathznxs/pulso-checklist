-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  imagem_padrao TEXT,
  prazo TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aguardando', 'concluida', 'expirada', 'ressalva')),
  setor TEXT,
  criado_por UUID NOT NULL REFERENCES public.profiles(id),
  atribuido_para UUID NOT NULL REFERENCES public.profiles(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Authenticated can read tasks they created or are assigned to
CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT TO authenticated USING (
    auth.uid() = atribuido_para
    OR auth.uid() = criado_por
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Lideranca+ can create tasks
CREATE POLICY "tasks_insert_lideranca" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Lideranca+ can update any task, assistente can update only their own assigned tasks
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE TO authenticated USING (
    auth.uid() = atribuido_para
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Lideranca+ can delete tasks
CREATE POLICY "tasks_delete_lideranca" ON public.tasks
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Task submissions table
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  comentario_assistente TEXT,
  imagem_assistente TEXT,
  status_validacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_validacao IN ('pendente', 'aprovada', 'devolvida')),
  feedback_lideranca TEXT,
  validado_por UUID REFERENCES public.profiles(id),
  validado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- Read submissions: task owner or lideranca+
CREATE POLICY "submissions_select" ON public.task_submissions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND (t.atribuido_para = auth.uid() OR t.criado_por = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );

-- Assistente can insert submissions for their own tasks
CREATE POLICY "submissions_insert" ON public.task_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND t.atribuido_para = auth.uid()
    )
  );

-- Lideranca+ can update submissions (validate)
CREATE POLICY "submissions_update_lideranca" ON public.task_submissions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND cargo IN ('lideranca', 'gerente', 'admin')
    )
  );
