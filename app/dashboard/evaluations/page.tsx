"use client"

import { useState } from "react"
import { useAuth, canEvaluateOthers } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type EvaluationItem = {
  id: string
  name: string
  description: string
  weight: number
  criteria: string
  score: number
  comment: string
}

type Evaluation = {
  id: string
  evaluatee: string
  period: string
  stage: 'self' | 'manager' | 'mg'
  status: 'pending' | 'in_progress' | 'submitted'
  items: EvaluationItem[]
}

export default function EvaluationsPage() {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([
    {
      id: "1",
      evaluatee: "山田太郎",
      period: "2024年度上期評価",
      stage: "self",
      status: "in_progress",
      items: [
        { id: "1", name: "業務遂行能力", description: "担当業務の遂行度", weight: 30, criteria: "5.0: 期待を大きく上回る\n4.0: 期待を上回る\n3.0: 期待通り\n2.0: やや不足\n1.0: 大幅に不足", score: 0, comment: "" },
        { id: "2", name: "コミュニケーション", description: "チーム内外との協調性", weight: 20, criteria: "5.0: 非常に優れている\n4.0: 優れている\n3.0: 標準的\n2.0: やや課題あり\n1.0: 改善が必要", score: 0, comment: "" },
        { id: "3", name: "目標達成度", description: "設定目標の達成状況", weight: 50, criteria: "5.0: 120%以上達成\n4.0: 100-120%達成\n3.0: 80-100%達成\n2.0: 60-80%達成\n1.0: 60%未満", score: 0, comment: "" }
      ]
    }
  ])
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation>(evaluations[0])

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

  const handleScoreChange = (itemId: string, score: string) => {
    const scoreValue = parseFloat(score) || 0
    if (scoreValue < 1.0 || scoreValue > 5.0) return

    setCurrentEvaluation({
      ...currentEvaluation,
      items: currentEvaluation.items.map(item =>
        item.id === itemId ? { ...item, score: scoreValue } : item
      )
    })
  }

  const handleCommentChange = (itemId: string, comment: string) => {
    setCurrentEvaluation({
      ...currentEvaluation,
      items: currentEvaluation.items.map(item =>
        item.id === itemId ? { ...item, comment } : item
      )
    })
  }

  const calculateTotalScore = () => {
    const totalWeight = currentEvaluation.items.reduce((sum, item) => sum + item.weight, 0)
    const weightedScore = currentEvaluation.items.reduce((sum, item) =>
      sum + (item.score * item.weight), 0
    )
    return totalWeight > 0 ? (weightedScore / totalWeight).toFixed(1) : "0.0"
  }

  const handleSubmit = () => {
    setCurrentEvaluation({
      ...currentEvaluation,
      status: 'submitted'
    })
    alert("評価を提出しました")
  }

  if (!user) return null

  const canEvaluate = canEvaluateOthers(user.role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">評価実施</h1>
        <p className="text-gray-600 mt-2">本人評価 → 店長評価 → MG評価</p>
      </div>

      <Tabs defaultValue="self" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="self">本人評価</TabsTrigger>
          <TabsTrigger value="manager">店長評価</TabsTrigger>
          <TabsTrigger value="mg">MG評価</TabsTrigger>
        </TabsList>

        <TabsContent value="self" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>本人評価</CardTitle>
                  <CardDescription>自己評価を入力してください</CardDescription>
                </div>
                {getStageBadge(currentEvaluation.stage)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">評価対象者</h3>
                <p className="text-lg">{currentEvaluation.evaluatee}</p>
                <p className="text-sm text-gray-600">{currentEvaluation.period}</p>
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
                      <Label htmlFor={`score-${item.id}`}>評価点（1.0〜5.0、小数点1位まで）</Label>
                      <Input
                        id={`score-${item.id}`}
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        placeholder="例: 4.5"
                        value={item.score || ""}
                        onChange={(e) => handleScoreChange(item.id, e.target.value)}
                        className="max-w-xs"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        加重スコア: {(item.score * item.weight).toFixed(1)}点
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`comment-${item.id}`}>コメント</Label>
                      <Input
                        id={`comment-${item.id}`}
                        placeholder="評価の理由や詳細を記入してください"
                        value={item.comment}
                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
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
                  各項目の評価点を配点で加重平均した総合スコアです
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSubmit} size="lg" className="flex-1">
                  評価を提出
                </Button>
                <Button variant="outline" size="lg">
                  下書き保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manager" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>店長評価</CardTitle>
              <CardDescription>店長による評価</CardDescription>
            </CardHeader>
            <CardContent>
              {canEvaluate ? (
                <p className="text-center text-gray-500 py-8">
                  本人評価が完了すると店長評価が可能になります
                </p>
              ) : (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">この評価は店長・管理者のみが実施できます。</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mg" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MG評価</CardTitle>
              <CardDescription>マネージャーによる最終評価</CardDescription>
            </CardHeader>
            <CardContent>
              {canEvaluate ? (
                <p className="text-center text-gray-500 py-8">
                  店長評価が完了するとMG評価が可能になります
                </p>
              ) : (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">この評価は管理者のみが実施できます。</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
