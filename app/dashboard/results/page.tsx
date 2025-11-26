"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useAuth, canViewAllEvaluations } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { generateEvaluationPDF, generateMultipleEvaluationsPDF, type EvaluationPDFData } from "@/lib/pdf-export"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type EvaluationResult = {
  id: string
  evaluatee: string
  period: string
  department: string
  stage: 'self' | 'manager' | 'mg' | 'final'
  status: 'pending' | 'submitted'
  totalScore: number
  submittedAt: string
  overall_comment?: string
  items?: {
    name: string
    description: string
    weight: number
    score: number
    comment: string
    criteria?: string
    grade?: string
  }[]
}

export default function ResultsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResult | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false)
  const [comparisonPerson, setComparisonPerson] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchEvaluations = useCallback(async () => {
    if (!user) return

    try {
      // 権限に応じた評価データを取得
      let evaluationsData = []

      if (user.role === 'admin' || user.role === 'mg') {
        // 管理者とMGは全ての評価を閲覧可能
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        evaluationsData = data || []
      } else if (user.role === 'manager') {
        // 店長は自部署の評価のみ閲覧可能
        // まず自部署のユーザーIDを取得
        const { data: deptUsers, error: deptError } = await supabase
          .from('users')
          .select('id')
          .eq('department', user.department)

        if (deptError) throw deptError

        const deptUserIds = (deptUsers || []).map(u => u.id)

        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .in('evaluatee_id', deptUserIds)
          .order('created_at', { ascending: false })

        if (error) throw error
        evaluationsData = data || []
      } else {
        // スタッフは自分の評価のみ閲覧可能
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluatee_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        evaluationsData = data || []
      }

      // 評価期間情報を取得
      const periodIds = [...new Set(evaluationsData.map(e => e.period_id))]
      const { data: periodsData, error: periodsError } = await supabase
        .from('evaluation_periods')
        .select('id, name')
        .in('id', periodIds)

      if (periodsError) throw periodsError

      // ユーザー情報を取得
      const userIds = [...new Set(evaluationsData.map(e => e.evaluatee_id))]
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, department')
        .in('id', userIds)

      if (usersError) throw usersError

      const periodsMap = new Map(periodsData?.map(p => [p.id, p]) || [])
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])

      // 削除されたユーザーの評価を除外
      const validEvaluations = evaluationsData.filter(e => usersMap.has(e.evaluatee_id))

      // 各評価のスコアを取得して総合点を計算
      const evaluationsWithScores = await Promise.all(
        validEvaluations.map(async (evaluation) => {
          const { data: scoresData, error: scoresError } = await supabase
            .from('evaluation_scores')
            .select(`
              score,
              comment,
              grade,
              item:evaluation_items(name, description, weight, criteria)
            `)
            .eq('evaluation_id', evaluation.id)

          if (scoresError) {
            console.error('スコアデータ取得エラー:', scoresError)
            // gradeカラムが存在しない場合は、gradeなしで取得を試みる
            const { data: scoresDataWithoutGrade, error: fallbackError } = await supabase
              .from('evaluation_scores')
              .select(`
                score,
                comment,
                item:evaluation_items(name, description, weight, criteria)
              `)
              .eq('evaluation_id', evaluation.id)

            if (fallbackError) throw fallbackError

            // gradeなしのデータを使用
            const totalScore = scoresDataWithoutGrade?.reduce((sum, s: any) => sum + (s.score || 0), 0) || 0
            const items = scoresDataWithoutGrade?.map((s: any) => ({
              name: s.item?.name || '',
              description: s.item?.description || '',
              weight: s.item?.weight || 0,
              score: s.score || 0,
              comment: s.comment || '',
              criteria: s.item?.criteria || '',
              grade: ''
            })) || []

            return {
              id: evaluation.id,
              evaluatee: usersMap.get(evaluation.evaluatee_id)?.name || '',
              period: periodsMap.get(evaluation.period_id)?.name || '',
              department: usersMap.get(evaluation.evaluatee_id)?.department || '',
              stage: evaluation.stage,
              status: evaluation.status,
              totalScore,
              submittedAt: evaluation.submitted_at ?
                new Date(evaluation.submitted_at).toLocaleDateString('ja-JP') : '-',
              items
            }
          }

          // 単純合計を計算
          let totalScore = 0
          if (scoresData && scoresData.length > 0) {
            totalScore = scoresData.reduce((sum, s: any) => sum + (s.score || 0), 0)
          }

          // 評価項目の詳細データを整形
          const items = scoresData?.map((s: any) => ({
            name: s.item?.name || '',
            description: s.item?.description || '',
            weight: s.item?.weight || 0,
            score: s.score || 0,
            comment: s.comment || '',
            criteria: s.item?.criteria || '',
            grade: s.grade || ''
          })) || []

          return {
            id: evaluation.id,
            evaluatee: usersMap.get(evaluation.evaluatee_id)?.name || '',
            period: periodsMap.get(evaluation.period_id)?.name || '',
            department: usersMap.get(evaluation.evaluatee_id)?.department || '',
            stage: evaluation.stage,
            status: evaluation.status,
            totalScore,
            submittedAt: evaluation.submitted_at ?
              new Date(evaluation.submitted_at).toLocaleDateString('ja-JP') : '-',
            items
          }
        })
      )

      setEvaluations(evaluationsWithScores)
      setError(null)
    } catch (error: any) {
      console.error('評価データの取得エラー:', error)
      console.error('エラー詳細:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      setError(error?.message || 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      fetchEvaluations()
    }
  }, [user, fetchEvaluations])

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
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive" }> = {
      self: { variant: "outline" },
      manager: { variant: "default" },
      mg: { variant: "secondary" },
      final: { variant: "destructive" }
    }
    const config = variants[stage] || variants.self
    return <Badge variant={config.variant}>{getStageLabel(stage)}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      pending: { variant: "outline", label: "未提出" },
      submitted: { variant: "default", label: "提出済み" }
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // 全ての部署と評価期間のリストを取得
  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(evaluations.map(e => e.department).filter(d => d !== ''))).sort()
  }, [evaluations])

  const uniquePeriods = useMemo(() => {
    return Array.from(new Set(evaluations.map(e => e.period).filter(p => p !== ''))).sort()
  }, [evaluations])

  // 権限に基づいてフィルタリング
  const filteredEvaluations = useMemo(() => {
    if (!user) return []

    let filtered = evaluations

    // スタッフは自分の評価のみ
    if (user.role === 'staff') {
      filtered = evaluations.filter(e => e.evaluatee === user.name)
    }
    // 店長は自部署の評価のみ（filterが"all"でない限り）
    else if (user.role === 'manager' && filter !== "all") {
      filtered = evaluations.filter(e => e.department === user.department)
    }
    // MG・管理者は全て見れる

    // さらにユーザーが選択したフィルターを適用
    if (filter === "my-evaluations") {
      filtered = filtered.filter(e => e.evaluatee === user.name)
    } else if (filter === "my-department") {
      filtered = filtered.filter(e => e.department === user.department)
    }

    // 部署フィルター
    if (departmentFilter !== "all") {
      filtered = filtered.filter(e => e.department === departmentFilter)
    }

    // 評価期間フィルター
    if (periodFilter !== "all") {
      filtered = filtered.filter(e => e.period === periodFilter)
    }

    // ステータスフィルター
    if (statusFilter === "submitted") {
      filtered = filtered.filter(e => e.status === "submitted")
    } else if (statusFilter === "pending") {
      filtered = filtered.filter(e => e.status === "pending")
    }

    return filtered
  }, [evaluations, user, filter, departmentFilter, periodFilter, statusFilter])

  const uniqueEvaluatees = useMemo(() => {
    return Array.from(new Set(filteredEvaluations.map(e => e.evaluatee)))
  }, [filteredEvaluations])

  const getPersonEvaluations = (name: string) => {
    const stageOrder = { 'self': 1, 'manager': 2, 'mg': 3, 'final': 4 }
    return evaluations
      .filter(e => e.evaluatee === name)
      .sort((a, b) => stageOrder[a.stage] - stageOrder[b.stage])
  }

  const handleExportPDF = async (person: string) => {
    const personEvals = getPersonEvaluations(person)
    const pdfData: EvaluationPDFData = {
      evaluatee: person,
      department: personEvals[0]?.department || "",
      period: personEvals[0]?.period || "",
      evaluations: personEvals.map(e => ({
        stage: getStageLabel(e.stage),
        status: e.status === 'submitted' ? '提出済み' : '未提出',
        totalScore: e.totalScore,
        submittedAt: e.submittedAt,
        items: e.items
      }))
    }
    await generateEvaluationPDF(pdfData)
  }

  const handleExportAllPDF = async () => {
    const allData: EvaluationPDFData[] = uniqueEvaluatees.map(person => {
      const personEvals = getPersonEvaluations(person)
      return {
        evaluatee: person,
        department: personEvals[0]?.department || "",
        period: personEvals[0]?.period || "",
        evaluations: personEvals.map(e => ({
          stage: getStageLabel(e.stage),
          status: e.status === 'submitted' ? '提出済み' : '未提出',
          totalScore: e.totalScore,
          submittedAt: e.submittedAt,
          items: e.items
        }))
      }
    })
    await generateMultipleEvaluationsPDF(allData)
  }

  const handleExportFilteredPDF = async () => {
    const filteredData: EvaluationPDFData[] = uniqueEvaluatees.map(person => {
      const personEvals = filteredEvaluations.filter(e => e.evaluatee === person)
      return {
        evaluatee: person,
        department: personEvals[0]?.department || "",
        period: personEvals[0]?.period || "",
        evaluations: personEvals.map(e => ({
          stage: getStageLabel(e.stage),
          status: e.status === 'submitted' ? '提出済み' : '未提出',
          totalScore: e.totalScore,
          submittedAt: e.submittedAt,
          items: e.items
        }))
      }
    })
    await generateMultipleEvaluationsPDF(filteredData)
  }

  if (!user) return null

  const canViewAll = canViewAllEvaluations(user.role)

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">評価一覧</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
              <p className="mb-4">{error}</p>
              <p className="text-sm mb-4">
                データベースのスキーマを確認してください。以下のSQLを実行する必要があるかもしれません：
              </p>
              <pre className="bg-white p-4 rounded border border-red-300 text-sm overflow-x-auto">
{`-- evaluation_scoresテーブルにgradeカラムを追加
ALTER TABLE evaluation_scores
ADD COLUMN IF NOT EXISTS grade text NULL;

-- evaluation_itemsテーブルにgrade関連カラムを追加
ALTER TABLE evaluation_items
ADD COLUMN IF NOT EXISTS grade_scores jsonb DEFAULT '{"A": 5, "B": 4, "C": 3, "D": 2, "E": 1}'::jsonb;

ALTER TABLE evaluation_items
ADD COLUMN IF NOT EXISTS grade_criteria jsonb DEFAULT '{"A": "", "B": "", "C": "", "D": "", "E": ""}'::jsonb;`}
              </pre>
              <Button onClick={() => window.location.reload()} className="mt-4">
                ページを再読み込み
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">評価一覧</h1>
        <p className="text-gray-600 mt-2">評価結果の確認とフィルタリング</p>
        {user.role === 'staff' && (
          <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-sm rounded">
            あなたの評価のみ表示されています
          </div>
        )}
        {user.role === 'manager' && (
          <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-sm rounded">
            あなたの店舗の評価が表示されています
          </div>
        )}
        {user.role === 'mg' && (
          <div className="mt-2 p-3 bg-green-50 text-green-800 text-sm rounded">
            全ての評価を閲覧できます
          </div>
        )}
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">評価一覧</TabsTrigger>
          <TabsTrigger value="unified">一元管理ビュー</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <CardTitle>評価一覧</CardTitle>
                  <CardDescription>閲覧権限に基づいた評価の一覧</CardDescription>
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="フィルター" />
                  </SelectTrigger>
                  <SelectContent>
                    {canViewAll && <SelectItem value="all">全ての評価</SelectItem>}
                    <SelectItem value="my-evaluations">自分の評価</SelectItem>
                    {(canViewAll || user.role === 'manager') && (
                      <SelectItem value="my-department">自部署の評価</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">部署</label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="全ての部署" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全ての部署</SelectItem>
                      {uniqueDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">評価期間</label>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="全ての期間" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全ての期間</SelectItem>
                      {uniquePeriods.map(period => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">ステータス</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="全てのステータス" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全てのステータス</SelectItem>
                      <SelectItem value="submitted">提出済みのみ</SelectItem>
                      <SelectItem value="pending">未提出のみ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">アクション</label>
                  <Button onClick={handleExportFilteredPDF} className="w-full">
                    フィルター後のPDFエクスポート
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>評価対象者</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>評価期間</TableHead>
                    <TableHead>評価段階</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>総合スコア</TableHead>
                    <TableHead>提出日</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">{evaluation.evaluatee}</TableCell>
                      <TableCell>{evaluation.department}</TableCell>
                      <TableCell>{evaluation.period}</TableCell>
                      <TableCell>{getStageBadge(evaluation.stage)}</TableCell>
                      <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                      <TableCell>
                        {evaluation.status === 'submitted' ? (
                          <span className="font-semibold">{evaluation.totalScore.toFixed(1)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{evaluation.submittedAt}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvaluation(evaluation)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unified" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>一元管理ビュー</CardTitle>
                  <CardDescription>同じ人の評価を並べて比較</CardDescription>
                </div>
                <Button onClick={handleExportAllPDF}>
                  全員のPDFをエクスポート
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {uniqueEvaluatees.map((person) => {
                const personEvals = getPersonEvaluations(person)
                const selfEval = personEvals.find(e => e.stage === 'self')
                const managerEval = personEvals.find(e => e.stage === 'manager')
                const mgEval = personEvals.find(e => e.stage === 'mg')
                const finalEval = personEvals.find(e => e.stage === 'final')

                return (
                  <Card key={person} className="border-2">
                    <CardHeader className="bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{person}</CardTitle>
                          <CardDescription>
                            {personEvals[0]?.department} - {personEvals[0]?.period}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => handleExportPDF(person)}>
                            PDFエクスポート
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setComparisonPerson(person)
                              setIsComparisonDialogOpen(true)
                            }}
                          >
                            比較表示
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const evals = getPersonEvaluations(person)
                              if (evals.length > 0) {
                                setSelectedEvaluation(evals[0])
                                setIsDetailDialogOpen(true)
                              }
                            }}
                          >
                            詳細を見る
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-4">
                        {/* 本人評価 */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">本人評価</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selfEval?.status === 'submitted' ? (
                              <>
                                <p className="text-3xl font-bold text-blue-600">
                                  {selfEval.totalScore.toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {selfEval.submittedAt}
                                </p>
                                <Badge variant="default" className="mt-2">提出済み</Badge>
                              </>
                            ) : (
                              <>
                                <p className="text-3xl font-bold text-gray-300">-</p>
                                <Badge variant="outline" className="mt-2">未提出</Badge>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        {/* 店長評価 */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">店長評価</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {managerEval?.status === 'submitted' ? (
                              <>
                                <p className="text-3xl font-bold text-green-600">
                                  {managerEval.totalScore.toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {managerEval.submittedAt}
                                </p>
                                <Badge variant="default" className="mt-2">提出済み</Badge>
                              </>
                            ) : (
                              <>
                                <p className="text-3xl font-bold text-gray-300">-</p>
                                <Badge variant="outline" className="mt-2">未提出</Badge>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        {/* MG評価 */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">MG評価</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {mgEval?.status === 'submitted' ? (
                              <>
                                <p className="text-3xl font-bold text-purple-600">
                                  {mgEval.totalScore.toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {mgEval.submittedAt}
                                </p>
                                <Badge variant="default" className="mt-2">提出済み</Badge>
                              </>
                            ) : (
                              <>
                                <p className="text-3xl font-bold text-gray-300">-</p>
                                <Badge variant="outline" className="mt-2">未提出</Badge>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* 進捗バー */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">評価進捗</span>
                          <span className="text-sm text-gray-600">
                            {personEvals.filter(e => e.status === 'submitted').length} / 3
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(personEvals.filter(e => e.status === 'submitted').length / 3) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 評価詳細ダイアログ */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>評価詳細</DialogTitle>
            <DialogDescription>
              評価の詳細情報を表示しています
            </DialogDescription>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">評価対象者</p>
                  <p className="font-semibold">{selectedEvaluation.evaluatee}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">部署</p>
                  <p className="font-semibold">{selectedEvaluation.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">評価期間</p>
                  <p className="font-semibold">{selectedEvaluation.period}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">評価段階</p>
                  <p className="font-semibold">{getStageBadge(selectedEvaluation.stage)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ステータス</p>
                  <p className="font-semibold">{getStatusBadge(selectedEvaluation.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">総合スコア</p>
                  <p className="font-semibold text-2xl text-blue-600">
                    {selectedEvaluation.status === 'submitted'
                      ? selectedEvaluation.totalScore.toFixed(1)
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">提出日</p>
                  <p className="font-semibold">{selectedEvaluation.submittedAt}</p>
                </div>
              </div>

              {selectedEvaluation.status === 'submitted' && selectedEvaluation.items && selectedEvaluation.items.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">評価項目の詳細</h3>
                  {selectedEvaluation.items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <div className="ml-4 text-right">
                          {item.grade && (
                            <div className="text-lg font-semibold text-gray-700 mb-1">{item.grade}評価</div>
                          )}
                          <div className="text-2xl font-bold text-blue-600">{item.score}点</div>
                          <div className="text-xs text-gray-500">重み: {item.weight}</div>
                        </div>
                      </div>
                      {item.criteria && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <p className="text-gray-700"><strong>評価基準:</strong> {item.criteria}</p>
                        </div>
                      )}
                      {item.comment && (
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                          <p className="text-sm text-gray-600 font-semibold mb-1">コメント:</p>
                          <p className="text-sm text-gray-800">{item.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded">
                  <p>※ 評価が未提出のため、詳細スコアとコメントはまだ表示されません。</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 比較表示ダイアログ */}
      <Dialog open={isComparisonDialogOpen} onOpenChange={setIsComparisonDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>評価比較表示</DialogTitle>
            <DialogDescription>
              本人評価・店長評価・MG評価・最終評価を横並びで比較
            </DialogDescription>
          </DialogHeader>
          {comparisonPerson && (() => {
            const personEvals = getPersonEvaluations(comparisonPerson)
            const selfEval = personEvals.find(e => e.stage === 'self')
            const managerEval = personEvals.find(e => e.stage === 'manager')
            const mgEval = personEvals.find(e => e.stage === 'mg')
            const finalEval = personEvals.find(e => e.stage === 'final')

            // 全ての評価項目を取得（本人評価から項目リストを取得）
            const items = selfEval?.items || managerEval?.items || mgEval?.items || finalEval?.items || []

            return (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold">{comparisonPerson}</p>
                  <p className="text-sm text-gray-600">
                    {personEvals[0]?.department} - {personEvals[0]?.period}
                  </p>
                </div>

                {items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-1 text-left sticky left-0 bg-gray-100 z-10 text-xs">項目</th>
                          <th className="border p-1 text-center bg-blue-50 text-xs" colSpan={2}>本人評価</th>
                          <th className="border p-1 text-center bg-green-50 text-xs" colSpan={2}>店長評価</th>
                          <th className="border p-1 text-center bg-purple-50 text-xs" colSpan={2}>MG評価</th>
                          <th className="border p-1 text-center bg-red-50 text-xs" colSpan={2}>最終評価</th>
                        </tr>
                        <tr className="bg-gray-50 text-[10px]">
                          <th className="border px-1 py-0.5 text-left sticky left-0 bg-gray-50 z-10">説明</th>
                          <th className="border px-1 py-0.5 text-center bg-blue-50 w-12">スコア</th>
                          <th className="border px-1 py-0.5 text-center bg-blue-50">コメント</th>
                          <th className="border px-1 py-0.5 text-center bg-green-50 w-12">スコア</th>
                          <th className="border px-1 py-0.5 text-center bg-green-50">コメント</th>
                          <th className="border px-1 py-0.5 text-center bg-purple-50 w-12">スコア</th>
                          <th className="border px-1 py-0.5 text-center bg-purple-50">コメント</th>
                          <th className="border px-1 py-0.5 text-center bg-red-50 w-12">スコア</th>
                          <th className="border px-1 py-0.5 text-center bg-red-50">コメント</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          // 項目名でマッチング（インデックスではなく）
                          const selfItem = selfEval?.items?.find(i => i.name === item.name)
                          const managerItem = managerEval?.items?.find(i => i.name === item.name)
                          const mgItem = mgEval?.items?.find(i => i.name === item.name)
                          const finalItem = finalEval?.items?.find(i => i.name === item.name)

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border px-1 py-0.5 sticky left-0 bg-inherit z-10">
                                <div className="font-semibold text-xs">{item.name}</div>
                                <div className="text-[10px] text-gray-600 mt-0.5">{item.description}</div>
                              </td>
                              {/* 本人評価 */}
                              <td className="border px-1 py-0.5 text-center bg-blue-50">
                                {selfEval?.status === 'submitted' && selfItem ? (
                                  <div>
                                    {selfItem.grade && <div className="text-[10px] font-semibold text-gray-700">{selfItem.grade}</div>}
                                    <span className="text-sm font-bold text-blue-600">{selfItem.score}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="border px-1 py-0.5 text-[10px] bg-blue-50">
                                {selfEval?.status === 'submitted' && selfItem?.comment ? (
                                  selfItem.comment
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              {/* 店長評価 */}
                              <td className="border px-1 py-0.5 text-center bg-green-50">
                                {managerEval?.status === 'submitted' && managerItem ? (
                                  <div>
                                    {managerItem.grade && <div className="text-[10px] font-semibold text-gray-700">{managerItem.grade}</div>}
                                    <span className="text-sm font-bold text-green-600">{managerItem.score}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="border px-1 py-0.5 text-[10px] bg-green-50">
                                {managerEval?.status === 'submitted' && managerItem?.comment ? (
                                  managerItem.comment
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              {/* MG評価 */}
                              <td className="border px-1 py-0.5 text-center bg-purple-50">
                                {mgEval?.status === 'submitted' && mgItem ? (
                                  <div>
                                    {mgItem.grade && <div className="text-[10px] font-semibold text-gray-700">{mgItem.grade}</div>}
                                    <span className="text-sm font-bold text-purple-600">{mgItem.score}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="border px-1 py-0.5 text-[10px] bg-purple-50">
                                {mgEval?.status === 'submitted' && mgItem?.comment ? (
                                  mgItem.comment
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              {/* 最終評価 */}
                              <td className="border px-1 py-0.5 text-center bg-red-50">
                                {finalEval?.status === 'submitted' && finalItem ? (
                                  <div>
                                    {finalItem.grade && <div className="text-[10px] font-semibold text-gray-700">{finalItem.grade}</div>}
                                    <span className="text-sm font-bold text-red-600">{finalItem.score}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="border px-1 py-0.5 text-[10px] bg-red-50">
                                {finalEval?.status === 'submitted' && finalItem?.comment ? (
                                  finalItem.comment
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold">
                          <td className="border p-2 text-right sticky left-0 bg-gray-100 z-10">総合スコア</td>
                          <td className="border p-2 text-center text-xl text-blue-600 bg-blue-50" colSpan={2}>
                            {selfEval?.status === 'submitted' ? selfEval.totalScore.toFixed(1) : '-'}
                          </td>
                          <td className="border p-2 text-center text-xl text-green-600 bg-green-50" colSpan={2}>
                            {managerEval?.status === 'submitted' ? managerEval.totalScore.toFixed(1) : '-'}
                          </td>
                          <td className="border p-2 text-center text-xl text-purple-600 bg-purple-50" colSpan={2}>
                            {mgEval?.status === 'submitted' ? mgEval.totalScore.toFixed(1) : '-'}
                          </td>
                          <td className="border p-2 text-center text-xl text-red-600 bg-red-50" colSpan={2}>
                            {finalEval?.status === 'submitted' ? finalEval.totalScore.toFixed(1) : '-'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded">
                    <p>※ 評価項目データがありません。</p>
                  </div>
                )}

                {/* 総評コメント表示 */}
                {finalEval?.status === 'submitted' && finalEval.overall_comment && (
                  <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">総評コメント</h3>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{finalEval.overall_comment}</p>
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
