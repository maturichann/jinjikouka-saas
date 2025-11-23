"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Textarea } from "@/components/ui/textarea"

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
}

type Evaluation = {
  id: string
  evaluatee_id: string
  evaluatee_name: string
  period_id: string
  period_name: string
  stage: 'self' | 'manager' | 'mg'
  status: 'pending' | 'in_progress' | 'submitted'
  items: EvaluationItem[]
}

export default function EvaluationsPage() {
  const { user } = useAuth()
  const [availableEvaluations, setAvailableEvaluations] = useState<Evaluation[]>([])
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const fetchAvailableEvaluations = useCallback(async () => {
    if (!user) return

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
        // MGはMG評価のみ実施可能
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('stage', 'mg')
          .in('status', ['pending', 'in_progress'])

        if (error) throw error
        evaluationsData = data || []
      } else if (user.role === 'manager') {
        // 店長は店長評価と自分の本人評価のみ実施可能
        const { data: selfEvals, error: selfError } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluatee_id', user.id)
          .eq('stage', 'self')
          .in('status', ['pending', 'in_progress'])

        if (selfError) throw selfError

        const { data: managerEvals, error: managerError } = await supabase
          .from('evaluations')
          .select('*')
          .eq('stage', 'manager')
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

      const evaluationsWithItems = evaluationsData.map(evaluation => {
        const evaluatee = usersMap.get(evaluation.evaluatee_id)
        const period = periodsMap.get(evaluation.period_id)

        return {
          id: evaluation.id,
          evaluatee_id: evaluation.evaluatee_id,
          evaluatee_name: evaluatee?.name || '',
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase, currentEvaluation])

  const loadEvaluation = useCallback(async (evaluationId: string) => {
    try {
      setIsLoading(true)

      // 評価の詳細を取得
      const { data: evalData, error: evalError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single()

      if (evalError) throw evalError

      // ユーザー情報を取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', evalData.evaluatee_id)
        .single()

      if (userError) throw userError

      // 評価期間情報を取得
      const { data: periodData, error: periodError } = await supabase
        .from('evaluation_periods')
        .select('id, name, template_id')
        .eq('id', evalData.period_id)
        .single()

      if (periodError) throw periodError

      // evalDataを拡張
      const evaluatee = userData
      const period = periodData

      // テンプレートの項目を取得
      const { data: templateData, error: templateError } = await supabase
        .from('evaluation_templates')
        .select('id, evaluation_items(*)')
        .eq('id', period.template_id)
        .single()

      if (templateError) throw templateError

      const templateItems = (templateData?.evaluation_items as any) || []

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
          grade_criteria: item.grade_criteria || { A: '', B: '', C: '', D: '', E: '' }
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
        items: itemsWithScores
      })
    } catch (error) {
      console.error('評価の読み込みエラー:', error)
      alert('評価の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      fetchAvailableEvaluations()
    }
  }, [user, fetchAvailableEvaluations])

  const handleGradeChange = async (itemId: string, grade: string) => {
    if (!currentEvaluation) return

    const item = currentEvaluation.items.find(i => i.id === itemId)
    if (!item) return

    // グレードに対応する点数を取得
    const score = item.grade_scores?.[grade as keyof typeof item.grade_scores] || 0

    const updatedItems = currentEvaluation.items.map(i =>
      i.id === itemId ? { ...i, grade, score } : i
    )

    setCurrentEvaluation({
      ...currentEvaluation,
      items: updatedItems
    })

    // 自動保存
    await saveScore(itemId, score, item.comment || '', grade)
  }

  const handleCommentChange = async (itemId: string, comment: string) => {
    if (!currentEvaluation) return

    const item = currentEvaluation.items.find(i => i.id === itemId)
    if (!item) return

    const updatedItems = currentEvaluation.items.map(i =>
      i.id === itemId ? { ...i, comment } : i
    )

    setCurrentEvaluation({
      ...currentEvaluation,
      items: updatedItems
    })

    // 自動保存
    await saveScore(itemId, item.score || 0, comment, item.grade || '')
  }

  const saveScore = async (itemId: string, score: number, comment: string, grade: string) => {
    if (!currentEvaluation || score === 0) return

    try {
      const { error } = await supabase
        .from('evaluation_scores')
        .upsert({
          evaluation_id: currentEvaluation.id,
          item_id: itemId,
          score,
          comment,
          grade
        }, {
          onConflict: 'evaluation_id,item_id'
        })

      if (error) throw error

      // ステータスを in_progress に更新（まだ pending の場合）
      if (currentEvaluation.status === 'pending') {
        await supabase
          .from('evaluations')
          .update({ status: 'in_progress' })
          .eq('id', currentEvaluation.id)

        setCurrentEvaluation({
          ...currentEvaluation,
          status: 'in_progress'
        })
      }
    } catch (error) {
      console.error('スコア保存エラー:', error)
    }
  }

  const calculateTotalScore = () => {
    if (!currentEvaluation) return "0"

    // 単純合計
    const totalScore = currentEvaluation.items.reduce((sum, item) => sum + item.score, 0)
    return totalScore.toFixed(1)
  }

  const handleSubmit = async () => {
    if (!currentEvaluation) return

    // 全項目にスコアが入っているか確認
    const hasAllScores = currentEvaluation.items.every(item => item.score > 0)
    if (!hasAllScores) {
      alert('全ての評価項目にスコアを入力してください')
      return
    }

    if (!confirm('評価を提出してもよろしいですか？提出後は編集できません。')) {
      return
    }

    try {
      setIsSaving(true)

      const { error } = await supabase
        .from('evaluations')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', currentEvaluation.id)

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
    alert('変更は自動保存されています')
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      self: "本人評価",
      manager: "店長評価",
      mg: "MG評価"
    }
    return labels[stage] || stage
  }

  const getStageBadge = (stage: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      self: { variant: "outline", label: "本人評価" },
      manager: { variant: "default", label: "店長評価" },
      mg: { variant: "secondary", label: "MG評価" }
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

  if (availableEvaluations.length === 0) {
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
        <p className="text-gray-600 mt-2">本人評価 → 店長評価 → MG評価</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>評価を選択</CardTitle>
          <CardDescription>実施する評価を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={currentEvaluation?.id || ''}
            onValueChange={loadEvaluation}
          >
            <SelectTrigger>
              <SelectValue placeholder="評価を選択" />
            </SelectTrigger>
            <SelectContent>
              {availableEvaluations.map(evaluation => (
                <SelectItem key={evaluation.id} value={evaluation.id}>
                  {evaluation.period_name} - {evaluation.evaluatee_name} ({getStageLabel(evaluation.stage)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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
              {getStageBadge(currentEvaluation.stage)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">評価対象者</h3>
              <p className="text-lg">{currentEvaluation.evaluatee_name}</p>
              <p className="text-sm text-gray-600">{currentEvaluation.period_name}</p>
            </div>

            {currentEvaluation.items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>{item.description} (配点: {item.weight}点)</CardDescription>
                  {item.criteria && (
                    <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                      <p className="font-semibold text-blue-900 mb-1">採点基準:</p>
                      <pre className="text-blue-800 whitespace-pre-line font-sans">{item.criteria}</pre>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`grade-${item.id}`}>評価グレード</Label>
                    <Select
                      value={item.grade || ''}
                      onValueChange={(value) => handleGradeChange(item.id, value)}
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="A/B/C/D/Eを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}評価 ({item.grade_scores?.[grade] || 0}点)
                            {item.grade_criteria?.[grade] && ` - ${item.grade_criteria[grade]}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {item.grade && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-1">選択中: {item.grade}評価</p>
                        <p className="text-lg font-bold text-blue-600">{item.score}点</p>
                        {item.grade_criteria?.[item.grade as keyof typeof item.grade_criteria] && (
                          <p className="text-sm text-gray-600 mt-2">
                            {item.grade_criteria[item.grade as keyof typeof item.grade_criteria]}
                          </p>
                        )}
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
                </CardContent>
              </Card>
            ))}

            <div className="p-6 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">総合評価</h3>
                <p className="text-3xl font-bold text-green-700">{calculateTotalScore()}</p>
              </div>
              <p className="text-sm text-gray-600">
                各項目の評価点を合計した総合スコアです
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSubmit}
                size="lg"
                className="flex-1"
                disabled={isSaving}
              >
                評価を提出
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleSaveDraft}
              >
                下書き保存
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
