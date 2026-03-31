export type UserRole = 'admin' | 'manager' | 'employee'

export type EvaluationStage = 'self' | 'manager' | 'mg'

export type EvaluationStatus = 'pending' | 'in_progress' | 'submitted'

export type PeriodStatus = 'draft' | 'active' | 'completed'

export type PermissionType = 'view' | 'edit'

export interface Profile {
  id: string
  email: string
  full_name: string
  department: string | null
  position: string | null
  manager_id: string | null
  role: UserRole
  created_at: string
  updated_at: string
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
  criteria: string | null // 採点基準
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
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface EvaluationScore {
  id: string
  evaluation_id: string
  item_id: string
  score: number // 1-5
  comment: string | null
  created_at: string
  updated_at: string
}

export interface EvaluationPermission {
  id: string
  user_id: string
  evaluation_id: string
  permission_type: PermissionType
  created_at: string
}

// Extended types with relations
export interface EvaluationWithDetails extends Evaluation {
  evaluatee: Profile
  evaluator: Profile | null
  period: EvaluationPeriod
  scores: (EvaluationScore & { item: EvaluationItem })[]
}

export interface EvaluationPeriodWithTemplate extends EvaluationPeriod {
  template: EvaluationTemplate & { items: EvaluationItem[] }
}
