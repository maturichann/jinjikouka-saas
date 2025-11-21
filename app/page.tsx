import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          人事考課SAAS
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          多段階評価システム（本人評価 → 店長評価 → MG評価）
        </p>

        <div className="space-y-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">主な機能</h2>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>カスタマイズ可能な評価項目</li>
              <li>5段階評価システム（小数点1位まで対応）</li>
              <li>多段階評価フロー</li>
              <li>結果の可視化とレポート</li>
              <li>評価閲覧権限フィルター</li>
              <li>同じ人の評価を並べて一元管理</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h2 className="font-semibold text-green-900 mb-2">実装済み機能</h2>
            <ul className="list-disc list-inside text-green-800 space-y-1">
              <li>ダッシュボード</li>
              <li>評価期間管理</li>
              <li>評価項目管理</li>
              <li>評価実施画面</li>
              <li>評価一覧</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/login" className="flex-1">
            <Button variant="outline" className="w-full" size="lg">
              ログイン
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full" size="lg">
              ダッシュボードへ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
