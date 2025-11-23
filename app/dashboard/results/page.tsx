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

type EvaluationResult = {
  id: string
  evaluatee: string
  period: string
  department: string
  stage: 'self' | 'manager' | 'mg'
  status: 'pending' | 'submitted'
  totalScore: number
  submittedAt: string
}

export default function ResultsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchEvaluations = useCallback(async () => {
    try {
      // 権限に応じた評価データを取得
      let query = supabase
        .from('evaluations')
        .select(`
          *,
          period:evaluation_periods(name),
          evaluatee:users!evaluatee_id(name, department)
        `)

      // 権限別フィルタリング
      if (user?.role === 'staff') {
        // スタッフは自分が評価者の評価のみ（自己評価のみ）
        query = query.eq('evaluator_id', user.id).eq('stage', 'self')
      } else if (user?.role === 'manager') {
        // 店長は自部署の評価のみ
        query = query.eq('evaluatee.department', user.department)
      }
      // mg と admin はすべての評価を閲覧可能（フィルタなし）

      const { data: evaluationsData, error: evalError } = await query.order('created_at', { ascending: false })

      if (evalError) throw evalError

      // 各評価のスコアを取得して総合点を計算
      const evaluationsWithScores = await Promise.all(
        (evaluationsData || []).map(async (evaluation) => {
          const { data: scoresData, error: scoresError } = await supabase
            .from('evaluation_scores')
            .select(`
              score,
              item:evaluation_items(weight)
            `)
            .eq('evaluation_id', evaluation.id)

          if (scoresError) throw scoresError

          // 加重平均を計算
          let totalScore = 0
          if (scoresData && scoresData.length > 0) {
            const totalWeight = scoresData.reduce((sum, s: any) => sum + (s.item?.weight || 0), 0)
            const weightedScore = scoresData.reduce((sum, s: any) =>
              sum + (s.score * (s.item?.weight || 0)), 0
            )
            totalScore = totalWeight > 0 ? weightedScore / totalWeight : 0
          }

          return {
            id: evaluation.id,
            evaluatee: evaluation.evaluatee?.name || '',
            period: evaluation.period?.name || '',
            department: evaluation.evaluatee?.department || '',
            stage: evaluation.stage,
            status: evaluation.status,
            totalScore,
            submittedAt: evaluation.submitted_at ?
              new Date(evaluation.submitted_at).toLocaleDateString('ja-JP') : '-'
          }
        })
      )

      setEvaluations(evaluationsWithScores)
    } catch (error) {
      console.error('評価データの取得エラー:', error)
      alert('評価データの取得に失敗しました')
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
      mg: "MG評価"
    }
    return labels[stage] || stage
  }

  const getStageBadge = (stage: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" }> = {
      self: { variant: "outline" },
      manager: { variant: "default" },
      mg: { variant: "secondary" }
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
    return Array.from(new Set(evaluations.map(e => e.department))).sort()
  }, [evaluations])

  const uniquePeriods = useMemo(() => {
    return Array.from(new Set(evaluations.map(e => e.period))).sort()
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

    return filtered
  }, [evaluations, user, filter, departmentFilter, periodFilter])

  const uniqueEvaluatees = useMemo(() => {
    return Array.from(new Set(filteredEvaluations.map(e => e.evaluatee)))
  }, [filteredEvaluations])

  const getPersonEvaluations = (name: string) => {
    return evaluations.filter(e => e.evaluatee === name)
  }

  const handleExportPDF = (person: string) => {
    const personEvals = getPersonEvaluations(person)
    const pdfData: EvaluationPDFData = {
      evaluatee: person,
      department: personEvals[0]?.department || "",
      period: personEvals[0]?.period || "",
      evaluations: personEvals.map(e => ({
        stage: getStageLabel(e.stage),
        status: e.status === 'submitted' ? 'Submitted' : 'Pending',
        totalScore: e.totalScore,
        submittedAt: e.submittedAt
      }))
    }
    generateEvaluationPDF(pdfData)
  }

  const handleExportAllPDF = () => {
    const allData: EvaluationPDFData[] = uniqueEvaluatees.map(person => {
      const personEvals = getPersonEvaluations(person)
      return {
        evaluatee: person,
        department: personEvals[0]?.department || "",
        period: personEvals[0]?.period || "",
        evaluations: personEvals.map(e => ({
          stage: getStageLabel(e.stage),
          status: e.status === 'submitted' ? 'Submitted' : 'Pending',
          totalScore: e.totalScore,
          submittedAt: e.submittedAt
        }))
      }
    })
    generateMultipleEvaluationsPDF(allData)
  }

  const handleExportFilteredPDF = () => {
    const filteredData: EvaluationPDFData[] = uniqueEvaluatees.map(person => {
      const personEvals = filteredEvaluations.filter(e => e.evaluatee === person)
      return {
        evaluatee: person,
        department: personEvals[0]?.department || "",
        period: personEvals[0]?.period || "",
        evaluations: personEvals.map(e => ({
          stage: getStageLabel(e.stage),
          status: e.status === 'submitted' ? 'Submitted' : 'Pending',
          totalScore: e.totalScore,
          submittedAt: e.submittedAt
        }))
      }
    })
    generateMultipleEvaluationsPDF(filteredData)
  }

  if (!user) return null

  const canViewAll = canViewAllEvaluations(user.role)

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
              <div className="flex gap-3 items-center">
                <div className="flex-1">
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
                <div className="flex-1">
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
                <div className="flex-1">
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
                        <Button variant="outline" size="sm">詳細</Button>
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
                          <Button variant="outline">詳細を見る</Button>
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
    </div>
  )
}
