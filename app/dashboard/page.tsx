import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600 mt-2">人事考課システムの管理画面です</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>評価期間管理</CardTitle>
            <CardDescription>
              評価期間の作成・編集・管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/periods">
              <Button className="w-full">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>評価項目管理</CardTitle>
            <CardDescription>
              評価テンプレートと項目の設定
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/templates">
              <Button className="w-full">管理画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>評価実施</CardTitle>
            <CardDescription>
              本人・店長・MG評価の実施
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/evaluations">
              <Button className="w-full">評価画面へ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>評価一覧</CardTitle>
            <CardDescription>
              評価結果の確認・フィルター
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/results">
              <Button className="w-full">一覧を見る</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>統計情報</CardTitle>
            <CardDescription>
              評価の統計とレポート
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">進行中の評価</span>
                <span className="font-semibold">0件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">完了した評価</span>
                <span className="font-semibold">0件</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>
              よく使う操作
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/periods">
              <Button variant="outline" className="w-full">
                新しい評価期間を作成
              </Button>
            </Link>
            <Link href="/dashboard/templates">
              <Button variant="outline" className="w-full">
                評価テンプレートを作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
