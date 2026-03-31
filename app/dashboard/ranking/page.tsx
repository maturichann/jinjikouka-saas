"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { FileDown, TrendingUp, TrendingDown, Minus, Save, Loader2 } from "lucide-react"
import { generateRankingPDF } from "@/lib/pdf-export"

type RankingEntry = {
  evaluatee_id: string
  evaluatee_name: string
  department: string
  totalScore: number
  rank: number
  previousScore?: number
  scoreChange?: number
  overall_comment?: string
  overall_grade?: string
  final_decision?: string
}

export default function RankingPage() {
  const { user } = useAuth()
  const [periods, setPeriods] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createClient>>(createClient())
  const [memo, setMemo] = useState("")
  const [memoSaving, setMemoSaving] = useState(false)

  // 管理者・MGチェック
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'mg') {
      window.location.href = '/dashboard'
    }
  }, [user])

  // 評価期間リストを取得
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'mg')) return

    const supabase = supabaseRef.current
    if (!supabase) return

    let isActive = true

    async function fetchPeriods(client: ReturnType<typeof createClient>) {
      const { data, error } = await client
        .from('evaluation_periods')
        .select('*')
        .order('start_date', { ascending: false })

      if (!isActive) return

      if (error) {
        console.error('評価期間取得エラー:', error)
        setPeriods([])
        setSelectedPeriod('')
        return
      }

      if (data) {
        setPeriods(data)
        setSelectedPeriod((prev) => (prev ? prev : data[0]?.id ?? ''))
      }
    }

    fetchPeriods(supabase)

    return () => {
      isActive = false
    }
  }, [user])

  // ランキングデータを取得
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'mg')) return

    const supabase = supabaseRef.current
    if (!supabase) return

    let isActive = true

    async function fetchRankings(client: ReturnType<typeof createClient>) {
      if (!selectedPeriod) {
        setRankings([])
        return
      }

      setIsLoading(true)
      try {
        // 現在の期間の情報を取得
        const { data: currentPeriod, error: currentPeriodError } = await client
          .from('evaluation_periods')
          .select('*')
          .eq('id', selectedPeriod)
          .single()

        if (!isActive) return

        if (currentPeriodError) {
          console.error('評価期間取得エラー:', currentPeriodError)
          setRankings([])
          return
        }

        // MGの場合、管轄店舗のユーザーIDを取得
        let managedUserIds: string[] | null = null
        if (user?.role === 'mg') {
          const managedDepts = user.managed_departments || []
          if (managedDepts.length === 0) {
            setRankings([])
            return
          }
          const { data: deptUsers, error: deptError } = await client
            .from('users')
            .select('id')
            .in('department', managedDepts)

          if (deptError) throw deptError

          managedUserIds = (deptUsers || []).map(u => u.id)
          if (managedUserIds.length === 0) {
            setRankings([])
            return
          }
        }

        // 最終評価のデータを取得
        let evaluationsQuery = client
          .from('evaluations')
          .select('*')
          .eq('period_id', selectedPeriod)
          .eq('stage', 'final')
          .in('status', ['submitted', 'confirmed'])

        if (managedUserIds) {
          evaluationsQuery = evaluationsQuery.in('evaluatee_id', managedUserIds)
        }

        const { data: evaluations, error } = await evaluationsQuery

        if (!isActive) return

        if (error) throw error

        // ユーザー情報を別途取得
        const evaluateeIds = [...new Set((evaluations || []).map((e: any) => e.evaluatee_id))]
        const { data: usersData } = evaluateeIds.length > 0
          ? await client.from('users').select('id, name, department').in('id', evaluateeIds)
          : { data: [] }
        const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]))

        // 直前の評価期間を探す（前期比）
        let previousPeriodId: string | null = null
        if (currentPeriod) {
          const { data: previousPeriods } = await client
            .from('evaluation_periods')
            .select('id, start_date')
            .lt('start_date', currentPeriod.start_date)
            .order('start_date', { ascending: false })
            .limit(1)

          if (previousPeriods && previousPeriods.length > 0) {
            previousPeriodId = previousPeriods[0].id
          }
        }

        if (!isActive) return

        // 全評価IDでスコアを一括取得（results/page.tsxと同じ単純合計方式）
        const allEvaluationIds = (evaluations || []).map((e: any) => e.id)
        const { data: allScores } = allEvaluationIds.length > 0
          ? await client.from('evaluation_scores').select('evaluation_id, score').in('evaluation_id', allEvaluationIds).limit(10000)
          : { data: [] }

        // evaluation_idごとにグルーピング
        const scoresMap = new Map<string, number[]>()
        for (const s of (allScores || [])) {
          const arr = scoresMap.get(s.evaluation_id) || []
          arr.push(s.score || 0)
          scoresMap.set(s.evaluation_id, arr)
        }

        // 前期の評価を一括取得
        let previousScoresMap = new Map<string, number>()
        if (previousPeriodId) {
          const evaluateeIds = (evaluations || []).map((e: any) => e.evaluatee_id)
          const { data: previousEvals } = await client
            .from('evaluations')
            .select('id, evaluatee_id')
            .eq('period_id', previousPeriodId)
            .eq('stage', 'final')
            .in('status', ['submitted', 'confirmed'])
            .in('evaluatee_id', evaluateeIds)

          if (previousEvals && previousEvals.length > 0) {
            const prevEvalIds = previousEvals.map(e => e.id)
            const { data: prevScores } = await client
              .from('evaluation_scores')
              .select('evaluation_id, score')
              .in('evaluation_id', prevEvalIds)

            // evaluatee_idごとの前期スコアマップ
            const prevEvalMap = new Map(previousEvals.map(e => [e.id, e.evaluatee_id]))
            const prevTotals = new Map<string, number>()
            for (const s of (prevScores || [])) {
              const evaluateeId = prevEvalMap.get(s.evaluation_id)
              if (evaluateeId) {
                prevTotals.set(evaluateeId, (prevTotals.get(evaluateeId) || 0) + (s.score || 0))
              }
            }
            previousScoresMap = new Map([...prevTotals].map(([k, v]) => [k, Math.round(v * 10) / 10]))
          }
        }

        // ランキングデータ構築（ループ内でクエリなし）
        const rankingData: RankingEntry[] = (evaluations || []).map((evaluation: any) => {
          const scores = scoresMap.get(evaluation.id) || []
          const totalScore = Math.round(scores.reduce((sum, s) => sum + s, 0) * 10) / 10

          const previousScore = previousScoresMap.get(evaluation.evaluatee_id)
          const scoreChange = previousScore !== undefined
            ? Math.round((totalScore - previousScore) * 10) / 10
            : undefined

          const evaluateeUser = usersMap.get(evaluation.evaluatee_id)
          return {
            evaluatee_id: evaluation.evaluatee_id,
            evaluatee_name: evaluateeUser?.name || '不明',
            department: evaluateeUser?.department || '不明',
            totalScore,
            rank: 0,
            previousScore,
            scoreChange,
            overall_comment: evaluation.overall_comment || '',
            overall_grade: evaluation.overall_grade || '',
            final_decision: evaluation.final_decision || ''
          }
        })

        if (!isActive) return

        // スコアでソートしてランクを付与
        const sorted = rankingData.sort((a, b) => b.totalScore - a.totalScore)
        sorted.forEach((entry, index) => {
          entry.rank = index + 1
        })

        setRankings(sorted)

        // 管理者の場合、メモを取得（同じ日付範囲の期間で共有）
        if (user?.role === 'admin' && currentPeriod) {
          // 同じ開始日・終了日を持つ期間のIDをDBから直接取得
          const { data: sameDatePeriods } = await client
            .from('evaluation_periods')
            .select('id')
            .eq('start_date', currentPeriod.start_date)
            .eq('end_date', currentPeriod.end_date)

          const sameDatePeriodIds = (sameDatePeriods || []).map((p: any) => p.id)

          if (sameDatePeriodIds.length > 0) {
            const { data: memoData } = await client
              .from('ranking_memos')
              .select('memo, period_id')
              .in('period_id', sameDatePeriodIds)
              .limit(1)
              .maybeSingle()

            if (isActive) {
              setMemo(memoData?.memo || '')
            }
          } else {
            if (isActive) {
              setMemo('')
            }
          }
        }
      } catch (error) {
        console.error('ランキング取得エラー:', error)
        setRankings([])
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    fetchRankings(supabase)

    return () => {
      isActive = false
    }
  }, [selectedPeriod, user])

  // メモ保存（同じ日付範囲の期間で共有）
  const saveMemo = async () => {
    if (!user || user.role !== 'admin' || !selectedPeriod) return
    const supabase = supabaseRef.current
    if (!supabase) return

    // 現在の期間情報をDBから取得
    const { data: currentPeriod } = await supabase
      .from('evaluation_periods')
      .select('start_date, end_date')
      .eq('id', selectedPeriod)
      .single()
    if (!currentPeriod) return

    // 同じ開始日・終了日の期間グループをDBから取得
    const { data: sameDatePeriods } = await supabase
      .from('evaluation_periods')
      .select('id')
      .eq('start_date', currentPeriod.start_date)
      .eq('end_date', currentPeriod.end_date)

    const sameDatePeriodIds = (sameDatePeriods || []).map((p: any) => p.id)

    // 既存のメモがあるperiod_idを探す（なければ最初の期間IDを使う）
    const { data: existingMemo } = await supabase
      .from('ranking_memos')
      .select('period_id')
      .in('period_id', sameDatePeriodIds)
      .limit(1)
      .maybeSingle()

    const canonicalPeriodId = existingMemo?.period_id || sameDatePeriodIds[0]

    setMemoSaving(true)
    try {
      const { error } = await supabase
        .from('ranking_memos')
        .upsert({
          period_id: canonicalPeriodId,
          memo,
          created_by: user.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'period_id' })

      if (error) throw error
    } catch (error) {
      console.error('メモ保存エラー:', error)
    } finally {
      setMemoSaving(false)
    }
  }

  const handleExportPDF = async () => {
    if (rankings.length === 0) return

    const period = periods.find(p => p.id === selectedPeriod)
    if (!period) return

    try {
      await generateRankingPDF({
        periodName: period.name,
        periodDates: `${period.start_date} 〜 ${period.end_date}`,
        rankings: rankings.map(r => ({
          rank: r.rank,
          name: r.evaluatee_name,
          department: r.department,
          totalScore: r.totalScore,
          previousScore: r.previousScore,
          scoreChange: r.scoreChange
        }))
      })
    } catch (error) {
      console.error('PDF出力エラー:', error)
    }
  }

  const getScoreChangeIcon = (scoreChange?: number) => {
    if (scoreChange === undefined) return null
    if (scoreChange > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (scoreChange < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getScoreChangeBadge = (scoreChange?: number) => {
    if (scoreChange === undefined) return <span className="text-gray-400 text-sm">-</span>

    const color = scoreChange > 0 ? 'text-green-600' : scoreChange < 0 ? 'text-red-600' : 'text-gray-600'
    const sign = scoreChange > 0 ? '+' : ''

    return (
      <div className="flex items-center gap-2">
        {getScoreChangeIcon(scoreChange)}
        <span className={`font-semibold ${color}`}>
          {sign}{scoreChange.toFixed(1)}
        </span>
      </div>
    )
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">1位</Badge>
    if (rank === 2) return <Badge className="bg-gray-400">2位</Badge>
    if (rank === 3) return <Badge className="bg-orange-600">3位</Badge>
    return <Badge variant="outline">{rank}位</Badge>
  }

  if (!user || (user.role !== 'admin' && user.role !== 'mg')) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">評価点数ランキング</h1>
        <p className="text-gray-600 mt-2">最終評価の総合スコアでランキング表示</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>評価期間を選択</CardTitle>
          <CardDescription>ランキングを表示する評価期間を選択してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="評価期間を選択" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({period.start_date} 〜 {period.end_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExportPDF} disabled={rankings.length === 0}>
              <FileDown className="mr-2 h-4 w-4" />
              PDF出力
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 管理者専用メモ（ランキングの上に表示） */}
      {!isLoading && selectedPeriod && rankings.length > 0 && user?.role === 'admin' && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">管理者メモ</CardTitle>
            <CardDescription>管理者のみが閲覧・編集できます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Textarea
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto'
                    el.style.height = el.scrollHeight + 'px'
                  }
                }}
                value={memo}
                onChange={(e) => {
                  setMemo(e.target.value)
                  const el = e.target
                  el.style.height = 'auto'
                  el.style.height = el.scrollHeight + 'px'
                }}
                placeholder="この評価期間に関するメモを記入..."
                className="min-h-[100px] resize-none overflow-hidden"
              />
              <div className="flex justify-end">
                <Button
                  onClick={saveMemo}
                  disabled={memoSaving}
                >
                  {memoSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  保存
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-gray-600">読み込み中...</p>
          </CardContent>
        </Card>
      ) : rankings.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-gray-600">最終評価が提出されたデータがありません</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>ランキング結果</CardTitle>
            <CardDescription>
              {rankings.length}名のランキング（最終評価の総合スコア順）
              {user?.role === 'mg' && user.managed_departments?.length > 0 && (
                <span className="block mt-1">管轄: {user.managed_departments.join('、')}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">順位</th>
                    <th className="text-left p-3 font-semibold">氏名</th>
                    <th className="text-left p-3 font-semibold">部署</th>
                    <th className="text-right p-3 font-semibold">総合スコア</th>
                    <th className="text-center p-3 font-semibold">前期比</th>
                    <th className="text-center p-3 font-semibold">総合評価</th>
                    <th className="text-center p-3 font-semibold">最終決定</th>
                    <th className="text-left p-3 font-semibold">総評</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((entry) => (
                    <tr
                      key={entry.evaluatee_id}
                      className={`border-b ${entry.rank <= 3 ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-3">
                        {getRankBadge(entry.rank)}
                      </td>
                      <td className="p-3 font-medium">{entry.evaluatee_name}</td>
                      <td className="p-3 text-gray-600">{entry.department}</td>
                      <td className="p-3 text-right">
                        <span className="text-2xl font-bold text-blue-600">
                          {entry.totalScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center">
                          {getScoreChangeBadge(entry.scoreChange)}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {entry.overall_grade && entry.overall_grade !== 'HOLD' ? (
                          <Badge className={
                            entry.overall_grade === 'A' ? 'bg-blue-600' :
                            entry.overall_grade === 'B' ? 'bg-green-600' :
                            entry.overall_grade === 'C' ? 'bg-yellow-600' :
                            entry.overall_grade === 'D' ? 'bg-orange-600' :
                            entry.overall_grade === 'E' ? 'bg-red-600' : ''
                          }>
                            {entry.overall_grade}
                          </Badge>
                        ) : entry.overall_grade === 'HOLD' ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">保留</Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {entry.final_decision && entry.final_decision !== 'HOLD' ? (
                          <Badge className={
                            entry.final_decision === 'A' ? 'bg-blue-600' :
                            entry.final_decision === 'B' ? 'bg-green-600' :
                            entry.final_decision === 'C' ? 'bg-yellow-600' :
                            entry.final_decision === 'D' ? 'bg-orange-600' :
                            entry.final_decision === 'E' ? 'bg-red-600' : ''
                          }>
                            {entry.final_decision}
                          </Badge>
                        ) : entry.final_decision === 'HOLD' ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">保留</Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {entry.overall_comment ? (
                          <p className="whitespace-pre-line">{entry.overall_comment}</p>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 期間全体の総評 */}
      {!isLoading && selectedPeriod && periods.find(p => p.id === selectedPeriod)?.period_summary && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">期間全体の総評</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 whitespace-pre-wrap">
              {periods.find(p => p.id === selectedPeriod)?.period_summary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
