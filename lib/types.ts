export type Cargo = "assistente" | "gerente"

export type TaskStatus =
  | "pendente"
  | "aguardando"
  | "concluida"
  | "expirada"
  | "ressalva"

export type SubmissionStatus = "pendente" | "aprovada" | "devolvida"

export type EventType =
  | "evento"
  | "visita"
  | "lançamento"
  | "folga"
  | "critico"

export type OperationalStatus = "crítico" | "atenção" | "normal" | "ótimo"

export interface Loja {
  id: string
  numero_loja: string
  nome: string
  ativo: boolean
  criado_em: string
}

export interface Profile {
  id: string
  microsoft_id: string | null
  matricula: string
  nome: string
  cargo: Cargo
  setor_base: string | null
  loja_id: string | null
  onboarding_completo: boolean
  ativo: boolean
  criado_em: string
}

export interface Task {
  id: string
  titulo: string
  descricao: string | null
  imagem_padrao: string | null
  prazo: string
  status: TaskStatus
  setor: string | null
  criado_por: string
  atribuido_para: string
  loja_id: string | null
  criado_em: string
  // Joined fields
  atribuido_profile?: Profile
  criado_profile?: Profile
}

export interface TaskSubmission {
  id: string
  task_id: string
  comentario_assistente: string | null
  imagem_assistente: string | null
  status_validacao: SubmissionStatus
  feedback_lideranca: string | null
  validado_por: string | null
  validado_em: string | null
  criado_em: string
}

export interface CalendarEvent {
  id: string
  titulo: string
  tipo: EventType
  data_inicio: string
  data_fim: string | null
  criado_por: string
  loja_id: string | null
  criado_em: string
}

export interface Challenge {
  id: string
  nome: string
  ativa: boolean
  data_inicio?: string | null
  data_fim?: string | null
  descricao?: string | null
  loja_id: string | null
  criado_em: string
}

export interface ChallengeScore {
  id: string
  challenge_id: string
  user_id: string
  pontos: number
  atualizado_em: string
  profile?: Profile
}

export interface Shift {
  id: string
  nome: string
  hora_inicio: string
  hora_fim: string
}

export interface FixedSchedule {
  id: string
  user_id: string
  setor: string
  turno_id: string
  dias_semana: number[]
  loja_id: string | null
  profile?: Profile
  shift?: Shift
}

export interface Announcement {
  id: string
  message: string
  ativo: boolean
  criado_por: string | null
  loja_id: string | null
  criado_em: string
}

export interface TemporarySchedule {
  id: string
  user_id: string
  setor: string
  data: string
  turno_id: string
  criado_por: string
  loja_id: string | null
  profile?: Profile
  shift?: Shift
}

/** Um dia da escala semanal (modelo scale_days). */
export interface ScaleDay {
  id: string
  profile_id: string
  dia_semana: number
  setor: string | null
  turno_id: string | null
  shift?: Shift
}

export interface Setor {
  id: string
  nome: string
  cor: string
  ativo: boolean
}

export interface DashboardStats {
  concluidas: number
  pendentes: number
  ressalvas: number
  expiradas: number
}

export interface SectorStats {
  name: string
  percentage: number
  concluidas: number
  total: number
  pendentes: number
}
