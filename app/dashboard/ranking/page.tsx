"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileDown, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { generateRankingPDF } from "@/lib/pdf-export"

type RankingEntry = {
  evaluatee_id: string
  evaluatee_name: string
  department: string
  totalScore: number
  rank: number
  previousScore?: number
  scoreChange?: number
}

export default function RankingPage() {
  const { user } = useAuth()
  const [periods, setPeriods] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // 管理者チェック
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard'
    }
  }, [user])

  // 評価期間リストを取得
  useEffect(() => {
    async function fetchPeriods() {
      const { data, error } = await supabase
        .from('evaluation_periods')
        .select('*')
        .order('start_date', { ascending: false })

      if (!error && data) {
        setPeriods(data)
        if (data.length > 0) {
          setSelectedPeriod(data[0].id)
        }
      }
    }

    if (user) {
      fetchPeriods()
    }
  }, [user, supabase])

  // ランキングデータを取得
  useEffect(() => {
    async function fetchRankings() {
      if (!selectedPeriod) return

      setIsLoading(true)
      try {
        // 現在の期間の情報を取得
        const { data: currentPeriod } = await supabase
          .from('evaluation_periods')
          .select('*')
          .eq('id', selectedPeriod)
          .single()

        // 最終評価のデータを取得
        const { data: evaluations, error } = await supabase
          .from('evaluations')
          .select(`
            *,
            evaluatee:users!evaluations_evaluatee_id_fkey(id, name, department)
          `)
          .eq('period_id', selectedPeriod)
          .eq('stage', 'final')
          .eq('status', 'submitted')

        if (error) throw error

        // 前年同時期の期間を探す
        let previousPeriodId: string | null = null
        if (currentPeriod) {
          const currentYear = new Date(currentPeriod.start_date).getFullYear()
          const { data: previousPeriods } = await supabase
            .from('evaluation_periods')
            .select('id, start_date')
            .gte('start_date', `${currentYear - 1}-01-01`)
            .lt('start_date', `${currentYear}-01-01`)
            .order('start_date', { ascending: false })
            .limit(1)

          if (previousPeriods && previousPeriods.length > 0) {
            previousPeriodId = previousPeriods[0].id
          }
        }

        // スコアで計算してランキング作成
        const rankingData: RankingEntry[] = await Promise.all(
          (evaluations || []).map(async (evaluation: any) => {
            // 評価項目のスコアを取得
            const { data: scores } = await supabase
              .from('evaluation_scores')
              .select('score')
              .eq('evaluation_id', evaluation.id)

            const totalScore = scores?.reduce((sum, s) => sum + (s.score || 0), 0) || 0

            // 前年度のスコアを取得
            let previousScore: number | undefined
            let scoreChange: number | undefined

            if (previousPeriodId) {
              const { data: previousEval } = await supabase
                .from('evaluations')
                .select('id')
                .eq('period_id', previousPeriodId)
                .eq('evaluatee_id', evaluation.evaluatee_id)
                .eq('stage', 'final')
                .eq('status', 'submitted')
                .maybeSingle()

              if (previousEval) {
                const { data: previousScores } = await supabase
                  .from('evaluation_scores')
                  .select('score')
                  .eq('evaluation_id', previousEval.id)

                previousScore = previousScores?.reduce((sum, s) => sum + (s.score || 0), 0) || 0
                scoreChange = totalScore - previousScore
              }
            }

            return {
              evaluatee_id: evaluation.evaluatee_id,
              evaluatee_name: evaluation.evaluatee?.name || '不明',
              department: evaluation.evaluatee?.department || '不明',
              totalScore,
              rank: 0, // 後で設定
              previousScore,
              scoreChange
            }
          })
        )

        // スコアでソートしてランクを付与
        const sorted = rankingData.sort((a, b) => b.totalScore - a.totalScore)
        sorted.forEach((entry, index) => {
          entry.rank = index + 1
        })

        setRankings(sorted)
      } catch (error) {
        console.error('ランキング取得エラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [selectedPeriod, supabase])

  const handleExportPDF = async () => {
    if (rankings.length === 0) return

    const period = periods.find(p => p.id === selectedPeriod)
    if (!period) return

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
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 1位</Badge>
    if (rank === 2) return <Badge className="bg-gray-400">🥈 2位</Badge>
    if (rank === 3) return <Badge className="bg-orange-600">🥉 3位</Badge>
    return <Badge variant="outline">{rank}位</Badge>
  }

  if (!user || user.role !== 'admin') {
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
                    <th className="text-center p-3 font-semibold">前年比</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
