"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
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
  evaluator_id?: string
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
  const router = useRouter()
  const [filter, setFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResult | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false)
  const [comparisonPerson, setComparisonPerson] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }

  const fetchEvaluations = useCallback(async () => {
    const supabase = supabaseRef.current
    if (!user || !supabase) return

    try {
      // 権限に応じた評価データを取得
      let evaluationsData = []

      if (user.role === 'admin') {
        // 管理者は全ての評価を閲覧可能
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        evaluationsData = data || []
      } else if (user.role === 'mg') {
        // MGは管轄店舗の評価のみ閲覧可能
        const managedDepts = user.managed_departments || []

        if (managedDepts.length === 0) {
          evaluationsData = []
        } else {
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
              .in('evaluatee_id', deptUserIds)
              .order('created_at', { ascending: false })

            if (error) throw error
            evaluationsData = data || []
          } else {
            evaluationsData = []
          }
        }
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
        // スタッフは自分の本人評価のみ閲覧可能
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('evaluatee_id', user.id)
          .eq('stage', 'self')
          .order('created_at', { ascending: false })

        if (error) throw error
        evaluationsData = data || []
      }

      // 評価期間情報を取得（template_idも含む）
      const periodIds = [...new Set(evaluationsData.map(e => e.period_id))]
      const { data: periodsData, error: periodsError } = await supabase
        .from('evaluation_periods')
        .select('id, name, template_id')
        .in('id', periodIds)

      if (periodsError) throw periodsError

      // テンプレートの全項目を取得
      const templateIds = [...new Set((periodsData || []).map(p => (p as any).template_id).filter(Boolean))]
      const templateItemsMap = new Map<string, any[]>()
      for (const templateId of templateIds) {
        const { data: templateData } = await supabase
          .from('evaluation_templates')
          .select('id, evaluation_items(*)')
          .eq('id', templateId)
          .single()
        if (templateData?.evaluation_items) {
          const items = (templateData.evaluation_items as any[]).sort((a: any, b: any) => (a.order_index ?? 999) - (b.order_index ?? 999))
          templateItemsMap.set(templateId, items)
        }
      }

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
          // テンプレートの全項目を取得
          const periodInfo = periodsMap.get(evaluation.period_id) as any
          const templateId = periodInfo?.template_id
          const allTemplateItems = templateId ? (templateItemsMap.get(templateId) || []) : []

          const { data: scoresData, error: scoresError } = await supabase
            .from('evaluation_scores')
            .select(`
              score,
              comment,
              grade,
              item_id
            `)
            .eq('evaluation_id', evaluation.id)

          if (scoresError) {
            console.error('スコアデータ取得エラー:', scoresError)
          }

          // スコアをitem_idでマップ化
          const scoresMap = new Map<string, any>()
          for (const s of (scoresData || [])) {
            scoresMap.set(s.item_id, s)
          }

          // テンプレートの全項目をベースに、スコアをマージ
          const items = allTemplateItems.map((templateItem: any) => {
            const score = scoresMap.get(templateItem.id)
            return {
              name: templateItem.name || '',
              description: templateItem.description || '',
              weight: templateItem.weight || 0,
              score: score?.score || 0,
              comment: score?.comment || '',
              criteria: templateItem.criteria || '',
              grade: score?.grade || '',
              order_index: templateItem.order_index ?? 999
            }
          })

          // order_indexで並び替え
          items.sort((a: any, b: any) => a.order_index - b.order_index)

          // 単純合計を計算
          const totalScore = items.reduce((sum: number, item: any) => sum + (item.score || 0), 0)

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
            overall_comment: evaluation.overall_comment || '',
            items,
            evaluator_id: evaluation.evaluator_id
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
  }, [user])

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
      if (user.role === 'mg' && user.managed_departments?.length > 0) {
        filtered = filtered.filter(e => user.managed_departments.includes(e.department))
      } else {
        filtered = filtered.filter(e => e.department === user.department)
      }
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

    // 評価段階フィルター
    if (stageFilter !== "all") {
      filtered = filtered.filter(e => e.stage === stageFilter)
    }

    // 名前順 → 評価段階順にソート
    const stageOrder: Record<string, number> = { self: 1, manager: 2, mg: 3, final: 4 }
    filtered.sort((a, b) => {
      const nameCompare = a.evaluatee.localeCompare(b.evaluatee, 'ja')
      if (nameCompare !== 0) return nameCompare
      return (stageOrder[a.stage] || 99) - (stageOrder[b.stage] || 99)
    })

    return filtered
  }, [evaluations, user, filter, departmentFilter, periodFilter, statusFilter, stageFilter])

  const uniqueEvaluatees = useMemo(() => {
    return Array.from(new Set(filteredEvaluations.map(e => e.evaluatee)))
  }, [filteredEvaluations])

  const getPersonEvaluations = (name: string) => {
    const stageOrder = { 'self': 1, 'manager': 2, 'mg': 3, 'final': 4 }
    return evaluations
      .filter(e => e.evaluatee === name)
      .sort((a, b) => stageOrder[a.stage] - stageOrder[b.stage])
  }

  // 総評閲覧権限: 管理者・MGのみ
  const canViewOverallComment = user?.role === 'admin' || user?.role === 'mg'

  const buildPDFData = (evals: EvaluationResult[]): EvaluationPDFData['evaluations'] => {
    return evals.map(e => ({
      stage: getStageLabel(e.stage),
      status: e.status === 'submitted' ? '提出済み' : '未提出',
      totalScore: e.totalScore,
      submittedAt: e.submittedAt,
      overall_comment: undefined,
      items: e.items?.map(item => ({ ...item, comment: '' }))
    }))
  }

  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async (person: string) => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const personEvals = getPersonEvaluations(person)
      if (personEvals.length === 0) {
        alert('エクスポートするデータがありません')
        return
      }
      const pdfData: EvaluationPDFData = {
        evaluatee: person,
        department: personEvals[0]?.department || "",
        period: personEvals[0]?.period || "",
        evaluations: buildPDFData(personEvals)
      }
      await generateEvaluationPDF(pdfData)
    } catch (err) {
      console.error('PDF出力エラー:', err)
      alert('PDF出力中にエラーが発生しました。コンソールを確認してください。')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportAllPDF = async () => {
    if (isExporting) return
    const count = uniqueEvaluatees.length
    if (count === 0) {
      alert('エクスポートするデータがありません')
      return
    }
    if (count > 5 && !confirm(`${count}名分のPDFを生成します。データ量が多いため時間がかかる場合があります。続行しますか？`)) {
      return
    }
    setIsExporting(true)
    try {
      const allData: EvaluationPDFData[] = uniqueEvaluatees.map(person => {
        const personEvals = getPersonEvaluations(person)
        return {
          evaluatee: person,
          department: personEvals[0]?.department || "",
          period: personEvals[0]?.period || "",
          evaluations: buildPDFData(personEvals)
        }
      })
      await generateMultipleEvaluationsPDF(allData)
    } catch (err) {
      console.error('PDF出力エラー:', err)
      alert('PDF出力中にエラーが発生しました。コンソールを確認してください。')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportFilteredPDF = async () => {
    if (isExporting) return
    const count = uniqueEvaluatees.length
    if (count === 0) {
      alert('エクスポートするデータがありません')
      return
    }
    if (count > 5 && !confirm(`${count}名分のPDFを生成します。データ量が多いため時間がかかる場合があります。続行しますか？`)) {
      return
    }
    setIsExporting(true)
    try {
      const filteredData: EvaluationPDFData[] = uniqueEvaluatees.map(person => {
        const personEvals = filteredEvaluations.filter(e => e.evaluatee === person)
        return {
          evaluatee: person,
          department: personEvals[0]?.department || "",
          period: personEvals[0]?.period || "",
          evaluations: buildPDFData(personEvals)
        }
      })
      await generateMultipleEvaluationsPDF(filteredData)
    } catch (err) {
      console.error('PDF出力エラー:', err)
      alert('PDF出力中にエラーが発生しました。コンソールを確認してください。')
    } finally {
      setIsExporting(false)
    }
  }

  if (!user) return null

  const canViewAll = canViewAllEvaluations(user.role)

  // 編集可能かどうかの判定
  const canEdit = (evaluation: EvaluationResult) => {
    if (evaluation.status !== 'submitted') return false
    // 自分が提出した評価は編集可能
    if (evaluation.evaluator_id === user.id) return true
    // 管理者は全て編集可能
    if (user.role === 'admin') return true
    // 店長は自部署のスタッフの店長評価を編集可能
    if (user.role === 'manager' && evaluation.stage === 'manager' && evaluation.department === user.department) return true
    // MGは管轄店舗のMG評価を編集可能
    if (user.role === 'mg' && evaluation.stage === 'mg' && user.managed_departments?.includes(evaluation.department)) return true
    return false
  }

  // 編集ページへ遷移
  const handleEdit = (evaluationId: string) => {
    router.push(`/dashboard/evaluations?edit=${evaluationId}`)
  }

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
            管轄店舗の評価を閲覧できます（{user.managed_departments?.join('、') || '未設定'}）
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <div>
                  <CardTitle>評価一覧</CardTitle>
                  <CardDescription>閲覧権限に基づいた評価の一覧</CardDescription>
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="フィルター" />
                  </SelectTrigger>
                  <SelectContent>
                    {canViewAll && <SelectItem value="all">全ての評価</SelectItem>}
                    <SelectItem value="my-evaluations">自分の評価</SelectItem>
                    {(canViewAll || user.role === 'manager') && (
                      <SelectItem value="my-department">
                        {user.role === 'mg' ? '管轄店舗の評価' : '自部署の評価'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
                  <label className="text-sm font-medium mb-1 block">評価段階</label>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="全ての段階" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全ての段階</SelectItem>
                      <SelectItem value="self">本人評価</SelectItem>
                      <SelectItem value="manager">店長評価</SelectItem>
                      <SelectItem value="mg">MG評価</SelectItem>
                      <SelectItem value="final">最終評価</SelectItem>
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
                  <Button onClick={handleExportFilteredPDF} className="w-full" size="sm" disabled={isExporting}>
                    {isExporting ? 'PDF生成中...' : 'PDFエクスポート'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>評価対象者</TableHead>
                    <TableHead className="hidden sm:table-cell">部署</TableHead>
                    <TableHead className="hidden md:table-cell">評価期間</TableHead>
                    <TableHead>段階</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>スコア</TableHead>
                    <TableHead className="hidden sm:table-cell">提出日</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium whitespace-nowrap">{evaluation.evaluatee}</TableCell>
                      <TableCell className="hidden sm:table-cell">{evaluation.department}</TableCell>
                      <TableCell className="hidden md:table-cell">{evaluation.period}</TableCell>
                      <TableCell>{getStageBadge(evaluation.stage)}</TableCell>
                      <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                      <TableCell>
                        {evaluation.status === 'submitted' ? (
                          <span className="font-semibold">{evaluation.totalScore.toFixed(1)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{evaluation.submittedAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                          {canEdit(evaluation) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(evaluation.id)}
                            >
                              編集
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unified" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <div>
                  <CardTitle>一元管理ビュー</CardTitle>
                  <CardDescription>同じ人の評価を並べて比較</CardDescription>
                </div>
                <Button onClick={handleExportAllPDF} size="sm" disabled={isExporting}>
                  {isExporting ? 'PDF生成中...' : '全員PDF出力'}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                  <Button onClick={handleExportFilteredPDF} className="w-full" size="sm" disabled={isExporting}>
                    {isExporting ? 'PDF生成中...' : 'PDFエクスポート'}
                  </Button>
                </div>
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
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                          <CardTitle>{person}</CardTitle>
                          <CardDescription>
                            {personEvals[0]?.department} - {personEvals[0]?.period}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => handleExportPDF(person)} disabled={isExporting}>
                            {isExporting ? '...' : 'PDF'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setComparisonPerson(person)
                              setIsComparisonDialogOpen(true)
                            }}
                          >
                            比較
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const evals = getPersonEvaluations(person)
                              if (evals.length > 0) {
                                setSelectedEvaluation(evals[0])
                                setIsDetailDialogOpen(true)
                              }
                            }}
                          >
                            詳細
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          {item.grade && item.grade !== 'HOLD' ? (
                            <>
                              <div className="text-lg font-semibold text-gray-700 mb-1">{item.grade}評価</div>
                              <div className="text-2xl font-bold text-blue-600">{item.score}点</div>
                            </>
                          ) : item.grade === 'HOLD' ? (
                            <div className="text-lg font-bold text-orange-500">保留</div>
                          ) : (
                            <div className="text-lg font-bold text-red-500">未評価</div>
                          )}
                          <div className="text-xs text-gray-500">配点: {item.weight}</div>
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
                                  selfItem.grade && selfItem.grade !== 'HOLD' ? (
                                    <div>
                                      <div className="text-[10px] font-semibold text-gray-700">{selfItem.grade}</div>
                                      <span className="text-sm font-bold text-blue-600">{selfItem.score}</span>
                                    </div>
                                  ) : selfItem.grade === 'HOLD' ? (
                                    <span className="text-[10px] font-bold text-orange-500">保留</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-red-500">未評価</span>
                                  )
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
                                  managerItem.grade && managerItem.grade !== 'HOLD' ? (
                                    <div>
                                      <div className="text-[10px] font-semibold text-gray-700">{managerItem.grade}</div>
                                      <span className="text-sm font-bold text-green-600">{managerItem.score}</span>
                                    </div>
                                  ) : managerItem.grade === 'HOLD' ? (
                                    <span className="text-[10px] font-bold text-orange-500">保留</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-red-500">未評価</span>
                                  )
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
                                  mgItem.grade && mgItem.grade !== 'HOLD' ? (
                                    <div>
                                      <div className="text-[10px] font-semibold text-gray-700">{mgItem.grade}</div>
                                      <span className="text-sm font-bold text-purple-600">{mgItem.score}</span>
                                    </div>
                                  ) : mgItem.grade === 'HOLD' ? (
                                    <span className="text-[10px] font-bold text-orange-500">保留</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-red-500">未評価</span>
                                  )
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
                                  finalItem.grade && finalItem.grade !== 'HOLD' ? (
                                    <div>
                                      <div className="text-[10px] font-semibold text-gray-700">{finalItem.grade}</div>
                                      <span className="text-sm font-bold text-red-600">{finalItem.score}</span>
                                    </div>
                                  ) : finalItem.grade === 'HOLD' ? (
                                    <span className="text-[10px] font-bold text-orange-500">保留</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-red-500">未評価</span>
                                  )
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

                {/* 総評コメント表示（管理者・MGのみ） */}
                {canViewOverallComment && finalEval?.status === 'submitted' && finalEval.overall_comment && (
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
