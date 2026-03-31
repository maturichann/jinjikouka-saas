export type UserRole = 'admin' | 'mg' | 'manager' | 'staff'

export type UserRank = 'S' | 'J' | 'M' | null

export type UserStatus = 'active' | 'on_leave' | 'retired'

export type EvaluationStage = 'self' | 'manager' | 'mg' | 'final'

export type EvaluationStatus = 'pending' | 'in_progress' | 'submitted' | 'confirmed'

export type PeriodStatus = 'draft' | 'active' | 'completed'

export interface User {
  id: string
  staff_code: string
  name: string
  role: UserRole
  department: string
  password_hash: string
  rank: UserRank
  status: UserStatus
  managed_departments: string[]
  skip_manager_evaluation: boolean
  created_at: string
}

export interface EvaluationTemplate {
  id: string
  name: string
  description: string | null
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EvaluationItem {
  id: string
  template_id: string
  name: string
  description: string | null
  weight: number
  criteria: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface EvaluationPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  template_id: string
  status: PeriodStatus
  period_summary: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Evaluation {
  id: string
  period_id: string
  evaluatee_id: string
  evaluator_id: string | null
  stage: EvaluationStage
  status: EvaluationStatus
  overall_comment: string | null
  overall_grade: string | null
  final_decision: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface EvaluationScore {
  id: string
  evaluation_id: string
  item_id: string
  score: number
  comment: string | null
  grade: string | null
  created_at: string
  updated_at: string
}

export interface RankingMemo {
  period_id: string
  memo: string | null
  created_by: string
  updated_at: string
}

export interface EvaluationWithDetails extends Evaluation {
  evaluatee: User
  evaluator: User | null
  period: EvaluationPeriod
  scores: (EvaluationScore & { item: EvaluationItem })[]
}

export interface EvaluationPeriodWithTemplate extends EvaluationPeriod {
  template: EvaluationTemplate & { items: EvaluationItem[] }
}
