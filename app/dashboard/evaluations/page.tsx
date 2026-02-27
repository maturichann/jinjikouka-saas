"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth, canEvaluateOthers } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

type GradeKey = 'A' | 'B' | 'C' | 'D' | 'E'

type EvaluationItem = {
  id: string
  name: string
  description: string
  weight: number
  criteria: string
  score: number
  comment: string
  grade?: string
  grade_scores?: { A: number; B: number; C: number; D: number; E: number }
  grade_criteria?: { A: string; B: string; C: string; D: string; E: string }
  hide_criteria_from_self?: boolean
  enabled_grades?: GradeKey[]
  category?: string
  subcategory?: string
}

type Evaluation = {
  id: string
  evaluatee_id: string
  evaluatee_name: string
  evaluatee_department?: string
  period_id: string
  period_name: string
  stage: 'self' | 'manager' | 'mg' | 'final'
  status: 'pending' | 'in_progress' | 'submitted'
  items: EvaluationItem[]
  overall_comment?: string
  overall_grade?: string
  final_decision?: string
}

type ReferenceScore = {
  grade: string
  score: number
  comment: string
}

type ReferenceEvaluation = {
  stage: string
  stageLabel: string
  totalScore: number
  overall_comment?: string
  items: Record<string, ReferenceScore> // item_id -> score data
}

export default function EvaluationsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [availableEvaluations, setAvailableEvaluations] = useState<Evaluation[]>([])
  const [submittedEvaluations, setSubmittedEvaluations] = useState<Evaluation[]>([])
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editIdProcessed, setEditIdProcessed] = useState(false)
  const [referenceEvaluations, setReferenceEvaluations] = useState<ReferenceEvaluation[]>([])
  const [showReference, setShowReference] = useState(true)
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const commentTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const currentEvaluationRef = useRef<Evaluation | null>(null)

  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }

  const fetchAvailableEvaluations = useCallback(async () => {
    const supabase = supabaseRef.current
    if (!user || !supabase) return

    try {
      let evaluationsData = []

      // 管理者の場合は全ての評価を実施可能
      if (user.role === 'admin') {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .in('status', ['pending', 'in_progress'])
          .order('created_at', { ascending: false })

        if (error) throw error
        evaluationsData = data || []
      } else if (user.role === 'mg') {
        // MGは管轄店舗スタッフのMG評価のみ実施可能
        const managedDepts = user.managed_departments || []

        if (managedDepts.length === 0) {
          // 管轄店舗が設定されていない場合は何も表示しない
          evaluationsData = []
        } else {
          // 管轄店舗のスタッフIDを取得
          const { data: deptUsers, error: deptError } = await supabase
            .from('users')
            .select('id')
            .in('department', managedDepts)

          if (deptError) throw deptError

          const deptUserIds = (deptUsers || []).map(u => u.id)

          if (deptUserIds.length > 0) {
            const { data, error } = await supabase
              .from('evaluations')
              .select('*')
              .eq('stage', 'mg')
              .in('evaluatee_id', deptUserIds)
              .in('status', ['pending', 'in_progress'])

            if (error) throw error
            evaluationsData = data || []
          } else {
            evaluationsData = []
          }
        }
      } else if (user.role === 'manager') {
        // 店長は自店舗スタッフの店長評価と自分の本人評価のみ実施可能
        const { data: selfEvals, error: selfError } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluatee_id', user.id)
          .eq('stage', 'self')
          .in('status', ['pending', 'in_progress'])

        if (selfError) throw selfError

        // 自店舗のスタッフIDを取得
        const { data: deptUsers, error: deptError } = await supabase
          .from('users')
          .select('id')
          .eq('department', user.department)

        if (deptError) throw deptError

        const deptUserIds = (deptUsers || []).map(u => u.id)

        // 自店舗スタッフの店長評価のみ取得
        const { data: managerEvals, error: managerError } = await supabase
          .from('evaluations')
          .select('*')
          .eq('stage', 'manager')
          .in('evaluatee_id', deptUserIds)
          .in('status', ['pending', 'in_progress'])

        if (managerError) throw managerError

        evaluationsData = [...(selfEvals || []), ...(managerEvals || [])]
      } else {
        // スタッフは本人評価のみ実施可能
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluatee_id', user.id)
          .eq('stage', 'self')
          .in('status', ['pending', 'in_progress'])

        if (error) throw error
        evaluationsData = data || []
      }

      // ユーザー情報を別途取得
      const userIds = [...new Set(evaluationsData.map(e => e.evaluatee_id))]
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, department')
        .in('id', userIds)

      if (usersError) throw usersError

      // 評価期間情報を別途取得
      const periodIds = [...new Set(evaluationsData.map(e => e.period_id))]
      const { data: periodsData, error: periodsError } = await supabase
        .from('evaluation_periods')
        .select('id, name')
        .in('id', periodIds)

      if (periodsError) throw periodsError

      // データをマージ
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])
      const periodsMap = new Map(periodsData?.map(p => [p.id, p]) || [])

      // 削除されたユーザーの評価を除外
      const validEvaluations = evaluationsData.filter(e => usersMap.has(e.evaluatee_id))

      const evaluationsWithItems = validEvaluations.map(evaluation => {
        const evaluatee = usersMap.get(evaluation.evaluatee_id)
        const period = periodsMap.get(evaluation.period_id)

        return {
          id: evaluation.id,
          evaluatee_id: evaluation.evaluatee_id,
          evaluatee_name: evaluatee?.name || '',
          evaluatee_department: evaluatee?.department || '',
          period_id: evaluation.period_id,
          period_name: period?.name || '',
          stage: evaluation.stage,
          status: evaluation.status,
          items: []
        }
      })

      setAvailableEvaluations(evaluationsWithItems)

      if (evaluationsWithItems.length > 0 && !currentEvaluation) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        loadEvaluation(evaluationsWithItems[0].id)
      }
    } catch (error: any) {
      console.error('評価の取得エラー:', error)
      console.error('エラー詳細:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      alert('評価の取得に失敗しました\n' + (error?.message || 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // 前期の最終評価を取得する関数
  const fetchPreviousFinalEvaluation = async (
    supabase: ReturnType<typeof createClient>,
    evaluateeId: string,
    currentPeriod: any
  ): Promise<ReferenceEvaluation | null> => {
    try {
      const { data: prevPeriods } = await supabase
        .from('evaluation_periods')
        .select('id, name')
        .lt('start_date', currentPeriod.start_date || currentPeriod.created_at)
        .order('start_date', { ascending: false })
        .limit(1)

      if (!prevPeriods || prevPeriods.length === 0) return null

      const { data: prevFinalEval } = await supabase
        .from('evaluations')
        .select('*')
        .eq('evaluatee_id', evaluateeId)
        .eq('period_id', prevPeriods[0].id)
        .eq('stage', 'final')
        .in('status', ['submitted', 'confirmed'])
        .maybeSingle()

      if (!prevFinalEval) return null

      const { data: prevScores } = await supabase
        .from('evaluation_scores')
        .select('*')
        .eq('evaluation_id', prevFinalEval.id)

      const itemsMap: Record<string, ReferenceScore> = {}
      let totalScore = 0
      for (const s of (prevScores || [])) {
        itemsMap[s.item_id] = {
          grade: s.grade || '',
          score: s.score || 0,
          comment: s.comment || ''
        }
        totalScore += s.score || 0
      }

      return {
        stage: 'prev_final',
        stageLabel: `前期最終（${prevPeriods[0].name}）`,
        totalScore,
        overall_comment: '',
        items: itemsMap
      }
    } catch {
      return null
    }
  }

  const loadEvaluation = useCallback(async (evaluationId: string, forEdit: boolean = false) => {
    const supabase = supabaseRef.current
    if (!supabase) return

    try {
      setIsLoading(true)
      setIsEditMode(forEdit)

      // 評価の詳細を取得
      const { data: evalData, error: evalError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single()

      if (evalError) throw evalError

      // ユーザー情報を取得（削除されている可能性があるためmaybeSingleを使用）
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', evalData.evaluatee_id)
        .maybeSingle()

      if (userError) throw userError

      // 評価期間情報を取得
      const { data: periodData, error: periodError } = await supabase
        .from('evaluation_periods')
        .select('id, name, template_id')
        .eq('id', evalData.period_id)
        .single()

      if (periodError) throw periodError

      // evalDataを拡張（ユーザーが削除されている場合はデフォルト値を使用）
      const evaluatee = userData || { id: evalData.evaluatee_id, name: '削除されたユーザー' }
      const period = periodData

      // テンプレートの項目を取得
      const { data: templateData, error: templateError } = await supabase
        .from('evaluation_templates')
        .select('id, evaluation_items(*)')
        .eq('id', period.template_id)
        .single()

      if (templateError) throw templateError

      const templateItems = (templateData?.evaluation_items as any) || []

      // order_indexで並び替え
      templateItems.sort((a: any, b: any) => (a.order_index ?? 999) - (b.order_index ?? 999))

      // 既存のスコアを取得
      const { data: scoresData, error: scoresError } = await supabase
        .from('evaluation_scores')
        .select('*')
        .eq('evaluation_id', evaluationId)

      if (scoresError) throw scoresError

      // 項目とスコアをマージ
      const itemsWithScores = templateItems.map((item: any) => {
        const existingScore = scoresData?.find(s => s.item_id === item.id)
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          weight: item.weight,
          criteria: item.criteria || '',
          score: existingScore?.score || 0,
          comment: existingScore?.comment || '',
          grade: existingScore?.grade || '',
          grade_scores: item.grade_scores || { A: 5, B: 4, C: 3, D: 2, E: 1 },
          grade_criteria: item.grade_criteria || { A: '', B: '', C: '', D: '', E: '' },
          hide_criteria_from_self: item.hide_criteria_from_self || false,
          enabled_grades: item.enabled_grades || ['A', 'B', 'C', 'D', 'E'],
          category: item.category || '',
          subcategory: item.subcategory || ''
        }
      })

      setCurrentEvaluation({
        id: evalData.id,
        evaluatee_id: evaluatee.id,
        evaluatee_name: evaluatee.name,
        period_id: period.id,
        period_name: period.name,
        stage: evalData.stage,
        status: evalData.status,
        items: itemsWithScores,
        overall_comment: evalData.overall_comment || '',
        overall_grade: evalData.overall_grade || '',
        final_decision: evalData.final_decision || ''
      })

      // 前段階の評価データを取得（参照用）
      const stageOrder: Record<string, number> = { self: 1, manager: 2, mg: 3, final: 4 }
      const currentStageNum = stageOrder[evalData.stage] || 0
      const previousStages = Object.entries(stageOrder)
        .filter(([, num]) => num < currentStageNum)
        .map(([stage]) => stage)

      if (previousStages.length > 0) {
        const { data: prevEvals } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluatee_id', evalData.evaluatee_id)
          .eq('period_id', evalData.period_id)
          .in('stage', previousStages)
          .eq('status', 'submitted')

        const stageLabels: Record<string, string> = {
          self: '本人評価', manager: '店長評価', mg: 'MG評価', final: '最終評価'
        }

        const refs: ReferenceEvaluation[] = []
        for (const prevEval of (prevEvals || [])) {
          const { data: prevScores } = await supabase
            .from('evaluation_scores')
            .select('*')
            .eq('evaluation_id', prevEval.id)

          const itemsMap: Record<string, ReferenceScore> = {}
          let totalScore = 0
          for (const s of (prevScores || [])) {
            itemsMap[s.item_id] = {
              grade: s.grade || '',
              score: s.score || 0,
              comment: s.comment || ''
            }
            totalScore += s.score || 0
          }

          refs.push({
            stage: prevEval.stage,
            stageLabel: stageLabels[prevEval.stage] || prevEval.stage,
            totalScore,
            overall_comment: prevEval.overall_comment || '',
            items: itemsMap
          })
        }

        refs.sort((a, b) => (stageOrder[a.stage] || 0) - (stageOrder[b.stage] || 0))

        // 前期の最終評価を取得
        const prevFinalRef = await fetchPreviousFinalEvaluation(supabase, evalData.evaluatee_id, period)
        if (prevFinalRef) {
          refs.push(prevFinalRef)
        }

        setReferenceEvaluations(refs)
      } else {
        // 前段階がない場合（本人評価）でも前期の最終評価は取得
        const refs: ReferenceEvaluation[] = []
        const prevFinalRef = await fetchPreviousFinalEvaluation(supabase, evalData.evaluatee_id, period)
        if (prevFinalRef) {
          refs.push(prevFinalRef)
        }
        setReferenceEvaluations(refs)
      }
    } catch (error) {
      console.error('評価の読み込みエラー:', error)
      alert('評価の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchSubmittedEvaluations = useCallback(async () => {
    const supabase = supabaseRef.current
    if (!user || !supabase) return

    try {
      let evaluationsData: any[] = []

      if (user.role === 'admin') {
        // 管理者は全ての提出済み評価を編集可能
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false })
        if (error) throw error
        evaluationsData = data || []
      } else if (user.role === 'mg') {
        // MGは自分が提出した評価 + 管轄店舗のMG評価
        const managedDepts = user.managed_departments || []
        const { data: myEvals, error: myError } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluator_id', user.id)
          .eq('status', 'submitted')
        if (myError) throw myError

        let deptEvals: any[] = []
        if (managedDepts.length > 0) {
          const { data: deptUsers } = await supabase
            .from('users').select('id').in('department', managedDepts)
          const deptUserIds = (deptUsers || []).map(u => u.id)
          if (deptUserIds.length > 0) {
            const { data, error } = await supabase
              .from('evaluations')
              .select('*')
              .eq('stage', 'mg')
              .in('evaluatee_id', deptUserIds)
              .eq('status', 'submitted')
            if (error) throw error
            deptEvals = data || []
          }
        }
        // 重複を除去
        const allEvals = [...(myEvals || []), ...deptEvals]
        const seen = new Set<string>()
        evaluationsData = allEvals.filter(e => {
          if (seen.has(e.id)) return false
          seen.add(e.id)
          return true
        })
      } else if (user.role === 'manager') {
        // 店長は自分が提出した評価 + 自店舗スタッフの店長評価
        const { data: myEvals, error: myError } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluator_id', user.id)
          .eq('status', 'submitted')
        if (myError) throw myError

        const { data: deptUsers } = await supabase
          .from('users').select('id').eq('department', user.department)
        const deptUserIds = (deptUsers || []).map(u => u.id)

        let deptEvals: any[] = []
        if (deptUserIds.length > 0) {
          const { data, error } = await supabase
            .from('evaluations')
            .select('*')
            .eq('stage', 'manager')
            .in('evaluatee_id', deptUserIds)
            .eq('status', 'submitted')
          if (error) throw error
          deptEvals = data || []
        }
        // 重複を除去
        const allEvals = [...(myEvals || []), ...deptEvals]
        const seen = new Set<string>()
        evaluationsData = allEvals.filter(e => {
          if (seen.has(e.id)) return false
          seen.add(e.id)
          return true
        })
      } else {
        // スタッフは自分が提出した評価のみ
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluator_id', user.id)
          .eq('status', 'submitted')
        if (error) throw error
        evaluationsData = data || []
      }

      evaluationsData.sort((a: any, b: any) =>
        new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
      )

      if (evaluationsData.length === 0) {
        setSubmittedEvaluations([])
        return
      }

      // ユーザー情報を別途取得
      const userIds = [...new Set(evaluationsData.map(e => e.evaluatee_id))]
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, department')
        .in('id', userIds)

      if (usersError) throw usersError

      // 評価期間情報を別途取得
      const periodIds = [...new Set(evaluationsData.map(e => e.period_id))]
      const { data: periodsData, error: periodsError } = await supabase
        .from('evaluation_periods')
        .select('id, name')
        .in('id', periodIds)

      if (periodsError) throw periodsError

      // データをマージ
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])
      const periodsMap = new Map(periodsData?.map(p => [p.id, p]) || [])

      const evaluationsWithNames = evaluationsData.map((evaluation: any) => {
        const evaluatee = usersMap.get(evaluation.evaluatee_id)
        const period = periodsMap.get(evaluation.period_id)

        return {
          id: evaluation.id,
          evaluatee_id: evaluation.evaluatee_id,
          evaluatee_name: evaluatee?.name || '削除されたユーザー',
          evaluatee_department: evaluatee?.department || '',
          period_id: evaluation.period_id,
          period_name: period?.name || '',
          stage: evaluation.stage,
          status: evaluation.status,
          items: []
        }
      })

      setSubmittedEvaluations(evaluationsWithNames)
    } catch (error: any) {
      console.error('提出済み評価の取得エラー:', error)
    }
  }, [user])

  // currentEvaluationRefをレンダリング時に同期（useEffectでは遅延する）
  currentEvaluationRef.current = currentEvaluation

  // stateとrefを同時に更新するヘルパー
  const updateEvaluation = (updater: Evaluation | null | ((prev: Evaluation | null) => Evaluation | null)) => {
    if (typeof updater === 'function') {
      setCurrentEvaluation(prev => {
        const next = updater(prev)
        currentEvaluationRef.current = next
        return next
      })
    } else {
      currentEvaluationRef.current = updater
      setCurrentEvaluation(updater)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAvailableEvaluations()
      fetchSubmittedEvaluations()
    }
  }, [user, fetchAvailableEvaluations, fetchSubmittedEvaluations])

  // URLパラメータから編集対象の評価を読み込む
  useEffect(() => {
    if (editId && !editIdProcessed && !isLoading) {
      setActiveTab('submitted')
      loadEvaluation(editId, true)
      setEditIdProcessed(true)
    }
  }, [editId, editIdProcessed, isLoading, loadEvaluation])

  const handleHoldToggle = async (itemId: string) => {
    if (!currentEvaluationRef.current) return

    const item = currentEvaluationRef.current.items.find(i => i.id === itemId)
    if (!item) return

    const isCurrentlyHold = item.grade === 'HOLD'

    if (isCurrentlyHold) {
      // 保留解除: gradeとscoreをクリア
      setCurrentEvaluation(prev => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map(i =>
            i.id === itemId ? { ...i, grade: '', score: 0 } : i
          )
        }
      })
      // DBからスコアレコードを削除
      const supabase = supabaseRef.current
      const evalRef = currentEvaluationRef.current
      if (supabase && evalRef) {
        await supabase.from('evaluation_scores').delete()
          .eq('evaluation_id', evalRef.id).eq('item_id', itemId)
      }
    } else {
      // 保留設定: grade='HOLD', score=0
      if (commentTimerRef.current[itemId]) {
        clearTimeout(commentTimerRef.current[itemId])
        delete commentTimerRef.current[itemId]
      }

      let latestComment = ''
      setCurrentEvaluation(prev => {
        if (!prev) return prev
        const prevItem = prev.items.find(i => i.id === itemId)
        latestComment = prevItem?.comment || ''
        return {
          ...prev,
          items: prev.items.map(i =>
            i.id === itemId ? { ...i, grade: 'HOLD', score: 0 } : i
          ),
          status: prev.status === 'pending' ? 'in_progress' : prev.status
        }
      })
      await saveScore(itemId, 0, latestComment, 'HOLD')
    }
  }

  const handleGradeChange = async (itemId: string, grade: string) => {
    if (!currentEvaluationRef.current) return

    const item = currentEvaluationRef.current.items.find(i => i.id === itemId)
    if (!item) return

    // グレードに対応する点数を取得
    const score = item.grade_scores?.[grade as keyof typeof item.grade_scores] || 0

    // 同じ項目のコメントデバウンスタイマーをクリア（古いデータでの上書きを防止）
    if (commentTimerRef.current[itemId]) {
      clearTimeout(commentTimerRef.current[itemId])
      delete commentTimerRef.current[itemId]
    }

    // 最新のコメントを取得するために関数型の更新を使用
    let latestComment = ''

    updateEvaluation(prev => {
      if (!prev) return prev
      const prevItem = prev.items.find(i => i.id === itemId)
      latestComment = prevItem?.comment || ''

      const updatedItems = prev.items.map(i =>
        i.id === itemId ? { ...i, grade, score } : i
      )

      return {
        ...prev,
        items: updatedItems,
        status: prev.status === 'pending' ? 'in_progress' : prev.status
      }
    })

    // 自動保存（最新のコメントを使用）
    await saveScore(itemId, score, latestComment, grade)
  }

  const handleCommentChange = (itemId: string, comment: string) => {
    if (!currentEvaluationRef.current) return

    updateEvaluation(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(i =>
          i.id === itemId ? { ...i, comment } : i
        )
      }
    })

    // デバウンス保存（タイマー発火時にrefから最新のグレード/スコアを読む）
    if (commentTimerRef.current[itemId]) {
      clearTimeout(commentTimerRef.current[itemId])
    }
    commentTimerRef.current[itemId] = setTimeout(async () => {
      const latest = currentEvaluationRef.current
      if (!latest) return
      const latestItem = latest.items.find(i => i.id === itemId)
      const latestGrade = latestItem?.grade || ''
      const latestScore = latestItem?.score || 0
      const latestComment = latestItem?.comment || ''
      await saveScore(itemId, latestScore, latestComment, latestGrade)
    }, 500)
  }

  const overallCommentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOverallCommentChange = (comment: string) => {
    if (!currentEvaluationRef.current) return

    updateEvaluation(prev => {
      if (!prev) return prev
      return { ...prev, overall_comment: comment }
    })

    // デバウンス保存
    if (overallCommentTimerRef.current) {
      clearTimeout(overallCommentTimerRef.current)
    }
    overallCommentTimerRef.current = setTimeout(async () => {
      await saveOverallComment(comment)
    }, 500)
  }

  const saveOverallComment = async (comment: string) => {
    const supabase = supabaseRef.current
    const evalRef = currentEvaluationRef.current
    if (!evalRef || !supabase) return

    try {
      const { error } = await supabase
        .from('evaluations')
        .update({ overall_comment: comment })
        .eq('id', evalRef.id)

      if (error) throw error
    } catch (error) {
      console.error('総評保存エラー:', error)
    }
  }

  const [saveError, setSaveError] = useState<string | null>(null)

  const saveScore = async (itemId: string, score: number, comment: string, grade: string) => {
    const supabase = supabaseRef.current
    const evalRef = currentEvaluationRef.current
    // グレードもコメントもない場合は保存しない
    if (!evalRef || !supabase) return
    if (!grade && !comment) return

    try {
      // スコアを保存
      const { error: scoreError } = await supabase
        .from('evaluation_scores')
        .upsert({
          evaluation_id: evalRef.id,
          item_id: itemId,
          score,
          comment,
          grade
        }, {
          onConflict: 'evaluation_id,item_id'
        })

      // upsertエラーの場合はDELETE→INSERTにフォールバック
      if (scoreError) {
        console.error('upsertエラー、フォールバック実行:', scoreError)
        await supabase.from('evaluation_scores').delete()
          .eq('evaluation_id', evalRef.id).eq('item_id', itemId)
        const { error: insertError } = await supabase.from('evaluation_scores').insert({
          evaluation_id: evalRef.id, item_id: itemId, score, comment, grade
        })
        if (insertError) throw insertError
      }

      setSaveError(null)

      // ステータスを in_progress に更新（まだ pending の場合）
      if (evalRef.status === 'pending') {
        await supabase
          .from('evaluations')
          .update({ status: 'in_progress' })
          .eq('id', evalRef.id)
      }
    } catch (error: any) {
      console.error('スコア保存エラー:', error)
      setSaveError(`保存に失敗しました: ${error?.message || '不明なエラー'}`)
    }
  }

  const calculateTotalScore = () => {
    if (!currentEvaluation) return "0"

    // 単純合計
    const totalScore = currentEvaluation.items.reduce((sum, item) => sum + item.score, 0)
    return totalScore.toFixed(1)
  }

  const scrollToMissingItem = (items: EvaluationItem[]) => {
    const missing = items.find(item => !item.grade || item.grade === '')
    if (missing) {
      const el = document.getElementById(`eval-item-${missing.id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-red-500', 'ring-offset-2')
        setTimeout(() => el.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2'), 3000)
      }
    }
  }

  const handleSubmit = async () => {
    const supabase = supabaseRef.current
    const latestEval = currentEvaluationRef.current
    if (!latestEval || !supabase) return

    // 完全未入力の項目をチェック（グレードなし・コメントなし・保留でもない）
    const untouchedItems = latestEval.items.filter(item =>
      (!item.grade || item.grade === '') && !item.comment
    )
    if (untouchedItems.length > 0) {
      scrollToMissingItem(untouchedItems)
      alert(`未入力の項目が${untouchedItems.length}件あります。グレード・コメントのいずれかを入力するか、保留にしてください。\n\n未入力: ${untouchedItems.map(i => i.name).join('、')}`)
      return
    }

    // コメントのみ（グレード未選択）の項目があれば確認
    const commentOnlyItems = latestEval.items.filter(item =>
      (!item.grade || item.grade === '') && item.comment
    )
    const holdItems = latestEval.items.filter(item => item.grade === 'HOLD')

    let confirmMsg = '評価を提出してもよろしいですか？'
    if (commentOnlyItems.length > 0) {
      confirmMsg += `\n\nグレード未選択の項目が${commentOnlyItems.length}件あります（コメントのみ）:\n${commentOnlyItems.map(i => i.name).join('、')}`
    }
    if (holdItems.length > 0) {
      confirmMsg += `\n\n保留: ${holdItems.length}件`
    }
    if (!confirm(confirmMsg)) {
      return
    }

    try {
      setIsSaving(true)

      // デバウンス中の保存をキャンセルし、全スコアを確実に保存
      Object.values(commentTimerRef.current).forEach(timer => clearTimeout(timer))
      commentTimerRef.current = {}
      if (overallCommentTimerRef.current) {
        clearTimeout(overallCommentTimerRef.current)
        overallCommentTimerRef.current = null
      }

      // refから最新の状態を再取得して保存
      const evalToSave = currentEvaluationRef.current
      if (!evalToSave) return

      // 各スコアを個別に保存（エラーチェック付き）
      const saveResults = await Promise.all(
        evalToSave.items
          .filter(item => item.grade || item.comment)
          .map(async (item) => {
            const { error } = await supabase
              .from('evaluation_scores')
              .upsert({
                evaluation_id: evalToSave.id,
                item_id: item.id,
                score: item.score,
                comment: item.comment,
                grade: item.grade || ''
              }, {
                onConflict: 'evaluation_id,item_id'
              })
            return { itemName: item.name, itemId: item.id, error }
          })
      )

      // upsertエラーの場合はDELETE→INSERTにフォールバック
      const failedSaves = saveResults.filter(r => r.error)
      if (failedSaves.length > 0) {
        console.error('スコア保存エラー（フォールバック実行）:', failedSaves)
        for (const failed of failedSaves) {
          const item = evalToSave.items.find(i => i.id === failed.itemId)
          if (!item) continue
          await supabase.from('evaluation_scores').delete()
            .eq('evaluation_id', evalToSave.id).eq('item_id', item.id)
          const { error: insertError } = await supabase.from('evaluation_scores').insert({
            evaluation_id: evalToSave.id, item_id: item.id,
            score: item.score, comment: item.comment, grade: item.grade || ''
          })
          if (insertError) throw new Error(`スコア保存失敗 (${failed.itemName}): ${insertError.message}`)
        }
      }

      // 総評コメント・総合評価・最終決定も保存
      const evalUpdate: Record<string, any> = {}
      if (evalToSave.overall_comment !== undefined) {
        evalUpdate.overall_comment = evalToSave.overall_comment
      }
      if (evalToSave.overall_grade !== undefined) {
        evalUpdate.overall_grade = evalToSave.overall_grade
      }
      if (evalToSave.final_decision !== undefined) {
        evalUpdate.final_decision = evalToSave.final_decision
      }
      if (Object.keys(evalUpdate).length > 0) {
        await supabase
          .from('evaluations')
          .update(evalUpdate)
          .eq('id', evalToSave.id)
      }

      const { error } = await supabase
        .from('evaluations')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          evaluator_id: user!.id
        })
        .eq('id', evalToSave.id)

      if (error) throw error

      alert('評価を提出しました')

      // リストを再取得
      await fetchAvailableEvaluations()
      setCurrentEvaluation(null)
    } catch (error) {
      console.error('提出エラー:', error)
      alert('評価の提出に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    const supabase = supabaseRef.current
    const evalToSave = currentEvaluationRef.current
    if (!evalToSave || !supabase) return

    try {
      setIsSaving(true)

      // デバウンス中のタイマーを全てクリア
      Object.values(commentTimerRef.current).forEach(timer => clearTimeout(timer))
      commentTimerRef.current = {}
      if (overallCommentTimerRef.current) {
        clearTimeout(overallCommentTimerRef.current)
        overallCommentTimerRef.current = null
      }

      // グレードが選択されている全項目を一括保存
      const itemsToSave = evalToSave.items.filter(item => item.grade && item.grade !== '')
      let savedCount = 0
      let failedItems: string[] = []

      for (const item of itemsToSave) {
        const { error: scoreError } = await supabase
          .from('evaluation_scores')
          .upsert({
            evaluation_id: evalToSave.id,
            item_id: item.id,
            score: item.score,
            comment: item.comment,
            grade: item.grade
          }, {
            onConflict: 'evaluation_id,item_id'
          })

        if (scoreError) {
          // フォールバック: DELETE→INSERT
          await supabase.from('evaluation_scores').delete()
            .eq('evaluation_id', evalToSave.id).eq('item_id', item.id)
          const { error: insertError } = await supabase.from('evaluation_scores').insert({
            evaluation_id: evalToSave.id, item_id: item.id,
            score: item.score, comment: item.comment, grade: item.grade
          })
          if (insertError) {
            failedItems.push(item.name)
            continue
          }
        }
        savedCount++
      }

      // 総評コメント・総合評価・最終決定も保存
      const draftUpdate: Record<string, any> = {}
      if (evalToSave.overall_comment !== undefined) {
        draftUpdate.overall_comment = evalToSave.overall_comment
      }
      if (evalToSave.overall_grade !== undefined) {
        draftUpdate.overall_grade = evalToSave.overall_grade
      }
      if (evalToSave.final_decision !== undefined) {
        draftUpdate.final_decision = evalToSave.final_decision
      }
      if (Object.keys(draftUpdate).length > 0) {
        await supabase
          .from('evaluations')
          .update(draftUpdate)
          .eq('id', evalToSave.id)
      }

      // ステータスを in_progress に更新
      if (evalToSave.status === 'pending') {
        await supabase
          .from('evaluations')
          .update({ status: 'in_progress' })
          .eq('id', evalToSave.id)
      }

      if (failedItems.length > 0) {
        setSaveError(`${failedItems.length}件の保存に失敗: ${failedItems.join('、')}`)
        alert(`下書き保存: ${savedCount}件保存、${failedItems.length}件失敗\n\n失敗: ${failedItems.join('、')}`)
      } else {
        setSaveError(null)
        alert(`下書き保存完了（${savedCount}/${evalToSave.items.length}項目を保存しました）`)
      }
    } catch (error: any) {
      console.error('下書き保存エラー:', error)
      setSaveError(`下書き保存に失敗: ${error?.message || '不明なエラー'}`)
      alert('下書き保存に失敗しました。もう一度お試しください。')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResubmit = async () => {
    const supabase = supabaseRef.current
    const latestEval = currentEvaluationRef.current
    if (!latestEval || !supabase || !user) return

    // 完全未入力の項目をチェック（グレードなし・コメントなし・保留でもない）
    const untouchedItems = latestEval.items.filter(item =>
      (!item.grade || item.grade === '') && !item.comment
    )
    if (untouchedItems.length > 0) {
      scrollToMissingItem(untouchedItems)
      alert(`未入力の項目が${untouchedItems.length}件あります。グレード・コメントのいずれかを入力するか、保留にしてください。\n\n未入力: ${untouchedItems.map(i => i.name).join('、')}`)
      return
    }

    // コメントのみ（グレード未選択）の項目があれば確認
    const commentOnlyItems = latestEval.items.filter(item =>
      (!item.grade || item.grade === '') && item.comment
    )
    const holdItems = latestEval.items.filter(item => item.grade === 'HOLD')

    let confirmMsg = '評価を再提出してもよろしいですか？'
    if (commentOnlyItems.length > 0) {
      confirmMsg += `\n\nグレード未選択の項目が${commentOnlyItems.length}件あります（コメントのみ）:\n${commentOnlyItems.map(i => i.name).join('、')}`
    }
    if (holdItems.length > 0) {
      confirmMsg += `\n\n保留: ${holdItems.length}件`
    }
    if (!confirm(confirmMsg)) {
      return
    }

    try {
      setIsSaving(true)

      // デバウンス中の保存をキャンセル
      Object.values(commentTimerRef.current).forEach(timer => clearTimeout(timer))
      commentTimerRef.current = {}
      if (overallCommentTimerRef.current) {
        clearTimeout(overallCommentTimerRef.current)
        overallCommentTimerRef.current = null
      }

      // refから最新の状態を取得
      const evalToSave = currentEvaluationRef.current
      if (!evalToSave) return

      // 各スコアを個別に保存（エラーチェック付き）
      const saveResults = await Promise.all(
        evalToSave.items
          .filter(item => item.grade || item.comment)
          .map(async (item) => {
            const { error } = await supabase
              .from('evaluation_scores')
              .upsert({
                evaluation_id: evalToSave.id,
                item_id: item.id,
                score: item.score,
                comment: item.comment,
                grade: item.grade || ''
              }, {
                onConflict: 'evaluation_id,item_id'
              })
            return { itemName: item.name, error }
          })
      )

      // upsertエラーを確認
      const failedSaves = saveResults.filter(r => r.error)
      if (failedSaves.length > 0) {
        console.error('スコア保存エラー:', failedSaves)
        for (const failed of failedSaves) {
          const item = evalToSave.items.find(i => i.name === failed.itemName)
          if (!item) continue
          await supabase.from('evaluation_scores').delete()
            .eq('evaluation_id', evalToSave.id).eq('item_id', item.id)
          const { error: insertError } = await supabase.from('evaluation_scores').insert({
            evaluation_id: evalToSave.id, item_id: item.id,
            score: item.score, comment: item.comment, grade: item.grade || ''
          })
          if (insertError) throw new Error(`スコア保存失敗 (${failed.itemName}): ${insertError.message}`)
        }
      }

      // 総評コメント・総合評価・最終決定も保存
      const evalUpdate: Record<string, any> = {
        submitted_at: new Date().toISOString(),
        evaluator_id: user!.id
      }
      if (evalToSave.overall_comment !== undefined) {
        evalUpdate.overall_comment = evalToSave.overall_comment
      }
      if (evalToSave.overall_grade !== undefined) {
        evalUpdate.overall_grade = evalToSave.overall_grade
      }
      if (evalToSave.final_decision !== undefined) {
        evalUpdate.final_decision = evalToSave.final_decision
      }

      const { error } = await supabase
        .from('evaluations')
        .update(evalUpdate)
        .eq('id', evalToSave.id)

      if (error) throw error

      alert('評価を再提出しました')

      // リストを再取得
      await fetchSubmittedEvaluations()
      setCurrentEvaluation(null)
      setIsEditMode(false)
    } catch (error: any) {
      console.error('再提出エラー:', error)
      alert(`評価の再提出に失敗しました: ${error?.message || '不明なエラー'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const loadSubmittedEvaluation = async (evaluationId: string) => {
    await loadEvaluation(evaluationId, true)
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      self: "本人評価",
      manager: "店長評価",
      mg: "MG評価",
      final: "最終評価"
    }
    return labels[stage] || stage
  }

  const getStageBadge = (stage: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive", label: string }> = {
      self: { variant: "outline", label: "本人評価" },
      manager: { variant: "default", label: "店長評価" },
      mg: { variant: "secondary", label: "MG評価" },
      final: { variant: "destructive", label: "最終評価" }
    }
    const config = variants[stage] || variants.self
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (!user) return null

  if (isLoading && !currentEvaluation) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">評価実施</h1>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  // 両方のリストが空の場合のみ表示
  if (availableEvaluations.length === 0 && submittedEvaluations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">評価実施</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500 py-8">
              現在実施可能な評価はありません
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">評価実施</h1>
        <p className="text-gray-600 mt-2">本人評価 → 店長評価 → MG評価 → 最終評価</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'pending' | 'submitted'); setCurrentEvaluation(null); setIsEditMode(false); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            未完了の評価 {availableEvaluations.length > 0 && `(${availableEvaluations.length})`}
          </TabsTrigger>
          <TabsTrigger value="submitted">
            提出済み評価 {submittedEvaluations.length > 0 && `(${submittedEvaluations.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>評価を選択</CardTitle>
              <CardDescription>実施する評価を選択してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableEvaluations.length === 0 ? (
                <p className="text-center text-gray-500 py-4">未完了の評価はありません</p>
              ) : (
                <>
                  {(() => {
                    const depts = [...new Set(availableEvaluations.map(e => e.evaluatee_department).filter(Boolean))]
                    if (depts.length <= 1) return null
                    return (
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="店舗で絞り込み" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全店舗</SelectItem>
                          {depts.sort((a, b) => a!.localeCompare(b!, 'ja')).map(dept => (
                            <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  })()}
                  <Select
                    value={currentEvaluation?.id || ''}
                    onValueChange={(id) => loadEvaluation(id, false)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="評価を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEvaluations
                        .filter(e => departmentFilter === 'all' || e.evaluatee_department === departmentFilter)
                        .map(evaluation => (
                          <SelectItem key={evaluation.id} value={evaluation.id}>
                            {evaluation.period_name} - {evaluation.evaluatee_name} ({getStageLabel(evaluation.stage)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submitted">
          <Card>
            <CardHeader>
              <CardTitle>提出済み評価を確認・編集</CardTitle>
              <CardDescription>
                あなたが提出した評価を閲覧・編集できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {submittedEvaluations.length === 0 ? (
                <p className="text-center text-gray-500 py-4">提出済みの評価はありません</p>
              ) : (
                <>
                  {(() => {
                    const depts = [...new Set(submittedEvaluations.map(e => e.evaluatee_department).filter(Boolean))]
                    if (depts.length <= 1) return null
                    return (
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="店舗で絞り込み" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全店舗</SelectItem>
                          {depts.sort((a, b) => a!.localeCompare(b!, 'ja')).map(dept => (
                            <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  })()}
                  <Select
                    value={currentEvaluation?.id || ''}
                    onValueChange={loadSubmittedEvaluation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="評価を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {submittedEvaluations
                        .filter(e => departmentFilter === 'all' || e.evaluatee_department === departmentFilter)
                        .map(evaluation => (
                          <SelectItem key={evaluation.id} value={evaluation.id}>
                            {evaluation.period_name} - {evaluation.evaluatee_name} ({getStageLabel(evaluation.stage)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {currentEvaluation && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{getStageLabel(currentEvaluation.stage)}</CardTitle>
                <CardDescription>
                  {currentEvaluation.period_name} - {currentEvaluation.evaluatee_name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditMode && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    編集中
                  </Badge>
                )}
                {getStageBadge(currentEvaluation.stage)}
              </div>
            </div>
            {isEditMode && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  提出済みの評価を編集しています。変更後「評価を再提出」ボタンで保存してください。
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">評価対象者</h3>
              <p className="text-lg">{currentEvaluation.evaluatee_name}</p>
              <p className="text-sm text-gray-600">{currentEvaluation.period_name}</p>
            </div>

            {/* 進捗バー */}
            {(() => {
              const total = currentEvaluation.items.length
              const holdCount = currentEvaluation.items.filter(i => i.grade === 'HOLD').length
              const done = currentEvaluation.items.filter(i => (i.grade && i.grade !== '') || i.comment).length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const isComplete = done === total
              return (
                <div className="sticky top-0 z-20 bg-white border rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">
                      入力進捗: <span className={isComplete ? 'text-green-600' : 'text-orange-600'}>{done}/{total}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {holdCount > 0 && (
                        <span className="text-xs text-orange-500 font-medium">保留{holdCount}件</span>
                      )}
                      <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {!isComplete && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-orange-600 underline"
                      onClick={() => {
                        const missing = currentEvaluation.items.find(i => (!i.grade || i.grade === '') && !i.comment)
                        if (missing) {
                          document.getElementById(`eval-item-${missing.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }}
                    >
                      未入力の項目へジャンプ →
                    </button>
                  )}
                </div>
              )
            })()}

            {referenceEvaluations.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium">参照評価:</span>
                  {referenceEvaluations.map(ref => (
                    <span key={ref.stage} className={`text-xs px-2 py-1 rounded-full font-medium ${
                      ref.stage === 'self' ? 'bg-blue-100 text-blue-700' :
                      ref.stage === 'manager' ? 'bg-green-100 text-green-700' :
                      ref.stage === 'mg' ? 'bg-purple-100 text-purple-700' :
                      ref.stage === 'prev_final' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ref.stageLabel}: {ref.totalScore.toFixed(1)}点
                    </span>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReference(!showReference)}
                  className="text-xs"
                >
                  {showReference ? '参照を隠す' : '参照を表示'}
                </Button>
              </div>
            )}

            {/* 保留・コメントのみ項目サマリー */}
            {(() => {
              const holdItems = currentEvaluation.items.filter(i => i.grade === 'HOLD')
              const commentOnlyItems = currentEvaluation.items.filter(i => (!i.grade || i.grade === '') && i.comment)
              if (holdItems.length === 0 && commentOnlyItems.length === 0) return null
              return (
                <div className="space-y-2">
                  {holdItems.length > 0 && (
                    <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-center gap-2">
                      <span className="text-red-600 font-bold text-sm">
                        保留中: {holdItems.length}件
                      </span>
                      <span className="text-red-500 text-xs">
                        ({holdItems.map(i => i.name).join('、')})
                      </span>
                    </div>
                  )}
                  {commentOnlyItems.length > 0 && (
                    <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg flex items-center gap-2">
                      <span className="text-yellow-700 font-bold text-sm">
                        コメントのみ（グレード未選択）: {commentOnlyItems.length}件
                      </span>
                      <span className="text-yellow-600 text-xs">
                        ({commentOnlyItems.map(i => i.name).join('、')})
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}

            {(() => {
              const circledNumbers = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳']
              // カテゴリ別にグループ化
              const categoryOrder = ['業績評価', '職務評価', '行動評価', '幹部評価']
              const grouped: Record<string, EvaluationItem[]> = {}
              for (const item of currentEvaluation.items) {
                const cat = item.category || '未分類'
                if (!grouped[cat]) grouped[cat] = []
                grouped[cat].push(item)
              }
              // カテゴリ順にソート（定義順→その他）
              const sortedCategories = Object.keys(grouped).sort((a, b) => {
                const ai = categoryOrder.indexOf(a)
                const bi = categoryOrder.indexOf(b)
                if (ai === -1 && bi === -1) return 0
                if (ai === -1) return 1
                if (bi === -1) return -1
                return ai - bi
              })

              return sortedCategories.map(category => {
                const items = grouped[category]
                // 行動評価はサブカテゴリでさらにグループ化
                const hasSubcategories = category === '行動評価' && items.some(i => i.subcategory)
                let subcategoryGroups: Record<string, EvaluationItem[]> = {}
                if (hasSubcategories) {
                  for (const item of items) {
                    const sub = item.subcategory || ''
                    if (!subcategoryGroups[sub]) subcategoryGroups[sub] = []
                    subcategoryGroups[sub].push(item)
                  }
                }

                let itemCounter = 0

                const renderItem = (item: EvaluationItem) => {
                  itemCounter++
                  const num = circledNumbers[itemCounter - 1] || `(${itemCounter})`
                  const isHold = item.grade === 'HOLD'
                  const hasGrade = item.grade && item.grade !== '' && item.grade !== 'HOLD'
                  const hasComment = !!item.comment
                  const isUntouched = !hasGrade && !hasComment && !isHold
                  const isCommentOnly = !hasGrade && hasComment && !isHold
                  return (
                    <Card key={item.id} id={`eval-item-${item.id}`} className={
                      isHold ? 'border-2 border-orange-400 bg-orange-50/30' :
                      isUntouched ? 'border-2 border-red-300 bg-red-50/20' :
                      isCommentOnly ? 'border-2 border-yellow-400 bg-yellow-50/20' :
                      'border border-green-200'
                    }>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="text-blue-600">{num}</span>
                              {item.name}
                              {isHold ? (
                                <Badge variant="destructive" className="text-xs">保留</Badge>
                              ) : hasGrade ? (
                                <Badge className="text-xs bg-green-100 text-green-700 border-green-300">✓</Badge>
                              ) : isCommentOnly ? (
                                <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">コメントのみ</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-red-500 border-red-300">未入力</Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{item.description} (配点: {item.weight}点)</CardDescription>
                          </div>
                          <Button
                            variant={isHold ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleHoldToggle(item.id)}
                            className="shrink-0 text-xs"
                          >
                            {isHold ? '保留解除' : '保留'}
                          </Button>
                        </div>
                        {item.criteria && currentEvaluation?.stage !== 'self' && currentEvaluation?.stage !== 'manager' && (
                          <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                            <p className="font-semibold text-blue-900 mb-1">採点基準:</p>
                            <pre className="text-blue-800 whitespace-pre-line font-sans">{item.criteria}</pre>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {showReference && referenceEvaluations.length > 0 && (
                          <div className="space-y-2">
                            {referenceEvaluations.map(ref => {
                              const refScore = ref.items[item.id]
                              if (!refScore) return null
                              const stageColor = ref.stage === 'self' ? 'blue' : ref.stage === 'manager' ? 'green' : ref.stage === 'mg' ? 'purple' : ref.stage === 'prev_final' ? 'amber' : 'red'
                              return (
                                <div key={ref.stage} className={`p-3 rounded-lg border`}
                                  style={{
                                    backgroundColor: stageColor === 'blue' ? '#eff6ff' : stageColor === 'green' ? '#f0fdf4' : stageColor === 'purple' ? '#faf5ff' : stageColor === 'amber' ? '#fffbeb' : '#fef2f2',
                                    borderColor: stageColor === 'blue' ? '#bfdbfe' : stageColor === 'green' ? '#bbf7d0' : stageColor === 'purple' ? '#e9d5ff' : stageColor === 'amber' ? '#fde68a' : '#fecaca'
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold"
                                      style={{ color: stageColor === 'blue' ? '#1d4ed8' : stageColor === 'green' ? '#15803d' : stageColor === 'purple' ? '#7e22ce' : stageColor === 'amber' ? '#b45309' : '#dc2626' }}
                                    >
                                      {ref.stageLabel}
                                    </span>
                                    <span className="text-sm font-semibold">
                                      {refScore.grade}評価 - {refScore.score}点
                                    </span>
                                  </div>
                                  {refScore.comment && (
                                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{refScore.comment}</p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {isHold ? (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                            <p className="text-red-600 font-semibold">この項目は保留中です</p>
                            <p className="text-red-500 text-sm mt-1">「保留解除」を押して評価を再開してください</p>
                          </div>
                        ) : (
                          <>
                            <div>
                              <Label className="mb-3 block">
                                評価グレード（{(item.enabled_grades || ['A', 'B', 'C', 'D', 'E']).length}段階）
                              </Label>
                              <RadioGroup
                                value={item.grade || undefined}
                                onValueChange={(value) => handleGradeChange(item.id, value)}
                                className="space-y-3"
                              >
                                {(item.enabled_grades || ['A', 'B', 'C', 'D', 'E']).map((grade) => (
                                  <Label
                                    key={grade}
                                    htmlFor={`${item.id}-${grade}`}
                                    className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                                  >
                                    <RadioGroupItem value={grade} id={`${item.id}-${grade}`} className="mt-1" />
                                    <div className="flex-1">
                                      <div className="font-semibold text-base">
                                        {grade}評価 - {item.grade_scores?.[grade as GradeKey] || 0}点
                                      </div>
                                      {item.grade_criteria?.[grade as GradeKey] && currentEvaluation?.stage !== 'self' && currentEvaluation?.stage !== 'manager' && (
                                        <div className="text-sm text-gray-600 mt-1">
                                          {item.grade_criteria[grade as GradeKey]}
                                        </div>
                                      )}
                                    </div>
                                  </Label>
                                ))}
                              </RadioGroup>
                              {item.grade && (
                                <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                                  <p className="text-sm font-semibold text-green-700 mb-1">選択中: {item.grade}評価</p>
                                  <p className="text-2xl font-bold text-green-600">{item.score}点</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <Label htmlFor={`comment-${item.id}`}>コメント</Label>
                              <Textarea
                                id={`comment-${item.id}`}
                                placeholder="評価の理由や詳細を記入してください"
                                value={item.comment}
                                onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                rows={3}
                              />
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                }

                return (
                  <div key={category} className="space-y-4">
                    <div className="p-3 bg-indigo-100 border-l-4 border-indigo-500 rounded-r-lg">
                      <h3 className="text-lg font-bold text-indigo-900">{category}</h3>
                    </div>
                    {hasSubcategories ? (
                      Object.entries(subcategoryGroups).map(([sub, subItems]) => (
                        <div key={sub} className="space-y-4 ml-2">
                          {sub && (
                            <div className="p-2 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                              <h4 className="text-base font-semibold text-purple-800">{sub}</h4>
                            </div>
                          )}
                          {subItems.map(renderItem)}
                        </div>
                      ))
                    ) : (
                      items.map(renderItem)
                    )}
                  </div>
                )
              })
            })()}

            {saveError && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
                {saveError}（ページを再読み込みして再度お試しください）
              </div>
            )}

            <div className="p-6 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">総合評価</h3>
                <p className="text-3xl font-bold text-green-700">{calculateTotalScore()}</p>
              </div>
              {showReference && referenceEvaluations.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {referenceEvaluations.map(ref => (
                    <div key={ref.stage} className="flex items-center gap-1.5 text-sm">
                      <span className={`w-2 h-2 rounded-full`}
                        style={{
                          backgroundColor: ref.stage === 'self' ? '#3b82f6' : ref.stage === 'manager' ? '#22c55e' : ref.stage === 'mg' ? '#a855f7' : '#ef4444'
                        }}
                      />
                      <span className="text-gray-600">{ref.stageLabel}:</span>
                      <span className="font-semibold">{ref.totalScore.toFixed(1)}点</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-600">
                各項目の評価点を合計した総合スコアです
              </p>
            </div>

            {showReference && referenceEvaluations.some(ref => ref.overall_comment) && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">参照: 総評コメント</h3>
                {referenceEvaluations.filter(ref => ref.overall_comment).map(ref => {
                  const stageColor = ref.stage === 'self' ? 'blue' : ref.stage === 'manager' ? 'green' : ref.stage === 'mg' ? 'purple' : 'red'
                  return (
                    <div key={ref.stage} className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: stageColor === 'blue' ? '#eff6ff' : stageColor === 'green' ? '#f0fdf4' : stageColor === 'purple' ? '#faf5ff' : '#fef2f2',
                        borderColor: stageColor === 'blue' ? '#bfdbfe' : stageColor === 'green' ? '#bbf7d0' : stageColor === 'purple' ? '#e9d5ff' : '#fecaca'
                      }}
                    >
                      <p className="text-sm font-bold mb-1"
                        style={{ color: stageColor === 'blue' ? '#1d4ed8' : stageColor === 'green' ? '#15803d' : stageColor === 'purple' ? '#7e22ce' : '#dc2626' }}
                      >
                        {ref.stageLabel}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{ref.overall_comment}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {currentEvaluation.stage === 'final' && (
              <>
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-900">総評コメント</CardTitle>
                    <CardDescription>
                      全ての評価を踏まえた総合的な評価コメントを記入してください
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="本評価期間における総合的な評価、強み、改善点、今後の期待など"
                      value={currentEvaluation.overall_comment || ''}
                      onChange={(e) => handleOverallCommentChange(e.target.value)}
                      rows={6}
                      className="bg-white"
                    />
                  </CardContent>
                </Card>

                {/* 総合評価 */}
                <Card className={
                  currentEvaluation.overall_grade === 'HOLD' ? 'border-2 border-orange-400 bg-orange-50/30' :
                  !currentEvaluation.overall_grade ? 'border-2 border-red-300 bg-red-50/20' :
                  'border border-green-200'
                }>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          総合評価
                          {currentEvaluation.overall_grade === 'HOLD' ? (
                            <Badge variant="destructive" className="text-xs">保留</Badge>
                          ) : currentEvaluation.overall_grade ? (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-300">✓ {currentEvaluation.overall_grade}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-red-500 border-red-300">未選択</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>全ての評価を踏まえた総合評価を選択してください</CardDescription>
                      </div>
                      <Button
                        variant={currentEvaluation.overall_grade === 'HOLD' ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => {
                          const isHold = currentEvaluation.overall_grade === 'HOLD'
                          updateEvaluation(prev => prev ? { ...prev, overall_grade: isHold ? '' : 'HOLD' } : prev)
                        }}
                        className="shrink-0 text-xs"
                      >
                        {currentEvaluation.overall_grade === 'HOLD' ? '保留解除' : '保留'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentEvaluation.overall_grade === 'HOLD' ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                        <p className="text-red-600 font-semibold">この項目は保留中です</p>
                        <p className="text-red-500 text-sm mt-1">「保留解除」を押して評価を再開してください</p>
                      </div>
                    ) : (
                      <RadioGroup
                        value={currentEvaluation.overall_grade || undefined}
                        onValueChange={(value) => {
                          updateEvaluation(prev => prev ? { ...prev, overall_grade: value } : prev)
                        }}
                        className="flex flex-wrap gap-3"
                      >
                        {['A', 'B', 'C', 'D', 'E'].map((grade) => (
                          <Label
                            key={grade}
                            htmlFor={`overall-grade-${grade}`}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              currentEvaluation.overall_grade === grade
                                ? 'border-amber-500 bg-amber-100 text-amber-900'
                                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                            }`}
                          >
                            <RadioGroupItem value={grade} id={`overall-grade-${grade}`} />
                            <span className="font-bold text-lg">{grade}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    )}
                  </CardContent>
                </Card>

                {/* 最終決定 */}
                <Card className={
                  currentEvaluation.final_decision === 'HOLD' ? 'border-2 border-orange-400 bg-orange-50/30' :
                  !currentEvaluation.final_decision ? 'border-2 border-red-300 bg-red-50/20' :
                  'border border-green-200'
                }>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          最終決定
                          {currentEvaluation.final_decision === 'HOLD' ? (
                            <Badge variant="destructive" className="text-xs">保留</Badge>
                          ) : currentEvaluation.final_decision ? (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-300">✓ {currentEvaluation.final_decision}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-red-500 border-red-300">未選択</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>最終的な評価決定を選択してください</CardDescription>
                      </div>
                      <Button
                        variant={currentEvaluation.final_decision === 'HOLD' ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => {
                          const isHold = currentEvaluation.final_decision === 'HOLD'
                          updateEvaluation(prev => prev ? { ...prev, final_decision: isHold ? '' : 'HOLD' } : prev)
                        }}
                        className="shrink-0 text-xs"
                      >
                        {currentEvaluation.final_decision === 'HOLD' ? '保留解除' : '保留'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentEvaluation.final_decision === 'HOLD' ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                        <p className="text-red-600 font-semibold">この項目は保留中です</p>
                        <p className="text-red-500 text-sm mt-1">「保留解除」を押して評価を再開してください</p>
                      </div>
                    ) : (
                      <RadioGroup
                        value={currentEvaluation.final_decision || undefined}
                        onValueChange={(value) => {
                          updateEvaluation(prev => prev ? { ...prev, final_decision: value } : prev)
                        }}
                        className="flex flex-wrap gap-3"
                      >
                        {['A', 'B', 'C', 'D', 'E'].map((grade) => (
                          <Label
                            key={grade}
                            htmlFor={`final-decision-${grade}`}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              currentEvaluation.final_decision === grade
                                ? 'border-red-500 bg-red-100 text-red-900'
                                : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                            }`}
                          >
                            <RadioGroupItem value={grade} id={`final-decision-${grade}`} />
                            <span className="font-bold text-lg">{grade}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* 提出前の最終確認 */}
            {(() => {
              const untouched = currentEvaluation.items.filter(i => (!i.grade || i.grade === '') && !i.comment)
              const commentOnly = currentEvaluation.items.filter(i => (!i.grade || i.grade === '') && i.comment)
              const holds = currentEvaluation.items.filter(i => i.grade === 'HOLD')
              const done = currentEvaluation.items.filter(i => (i.grade && i.grade !== '') || i.comment).length
              if (untouched.length === 0 && commentOnly.length === 0) {
                return (
                  <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                    <p className="text-green-700 font-bold text-center">
                      全{currentEvaluation.items.length}項目の入力が完了しています
                      {holds.length > 0 && `（うち保留${holds.length}件）`}
                    </p>
                  </div>
                )
              }
              return (
                <div className={`p-4 ${untouched.length > 0 ? 'bg-red-50 border-2 border-red-300' : 'bg-yellow-50 border-2 border-yellow-300'} rounded-lg space-y-2`}>
                  <p className={`${untouched.length > 0 ? 'text-red-700' : 'text-yellow-700'} font-bold`}>
                    入力状況: {done}/{currentEvaluation.items.length}項目完了
                  </p>
                  {untouched.length > 0 && (
                    <div>
                      <p className="text-red-600 text-sm font-medium">未入力（{untouched.length}件）- 提出にはグレードかコメントが必要:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {untouched.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                            onClick={() => document.getElementById(`eval-item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {commentOnly.length > 0 && (
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">コメントのみ（{commentOnly.length}件）- グレード未選択:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {commentOnly.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                            onClick={() => document.getElementById(`eval-item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {holds.length > 0 && (
                    <div>
                      <p className="text-orange-600 text-sm font-medium">保留中（{holds.length}件）:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {holds.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
                            onClick={() => document.getElementById(`eval-item-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="flex gap-4">
              {isEditMode ? (
                <>
                  <Button
                    onClick={handleResubmit}
                    size="lg"
                    className="flex-1"
                    disabled={isSaving}
                  >
                    評価を再提出
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setCurrentEvaluation(null)
                      setIsEditMode(false)
                    }}
                  >
                    キャンセル
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="flex-1"
                    disabled={isSaving}
                  >
                    {isSaving ? '保存中...' : '評価を提出'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
