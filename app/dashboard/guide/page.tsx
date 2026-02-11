"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">使い方ガイド</h1>
        <p className="text-gray-600 mt-2">人事考課SAASの詳細な操作方法</p>
      </div>

      {/* 権限一覧 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">👤 役割と権限</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">役割</th>
                  <th className="text-center py-2 px-3">ユーザー管理</th>
                  <th className="text-center py-2 px-3">テンプレート</th>
                  <th className="text-center py-2 px-3">評価期間</th>
                  <th className="text-center py-2 px-3">評価実施</th>
                  <th className="text-center py-2 px-3">評価閲覧</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="py-2 px-3 font-semibold">管理者</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">全て</td>
                  <td className="text-center">全て</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-semibold">MG評価者</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">管轄店舗</td>
                  <td className="text-center">管轄店舗</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-semibold">店長評価者</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">自店舗</td>
                  <td className="text-center">自店舗</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">スタッフ</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">本人評価のみ</td>
                  <td className="text-center">本人評価のみ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ステップ1: テンプレート作成 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-lg px-3 py-1">ステップ 1</Badge>
            <CardTitle>評価テンプレートを作成</CardTitle>
          </div>
          <CardDescription>評価項目と配点を設定します（管理者・MG評価者のみ）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">📋 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価項目管理」をクリック</li>
              <li>「新しいテンプレートを作成」ボタンをクリック</li>
              <li>テンプレート名と説明を入力
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li>例: 「2024年Sランク用評価」</li>
                  <li>説明: 「Sランクスタッフ向けの評価シート」</li>
                </ul>
              </li>
              <li>作成したテンプレートを選択</li>
              <li>「評価項目を追加」で各項目を設定
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>項目名</strong>: 例「業務遂行能力」</li>
                  <li><strong>説明</strong>: 項目の詳細説明</li>
                  <li><strong>配点</strong>: 例「30」（合計100点になるように調整）</li>
                  <li><strong>採点基準</strong>: 各グレード（A〜E）の基準を設定</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-1">💡 評価基準の表示について</p>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>・<strong>本人評価・店長評価</strong>: 評価基準は非表示</li>
              <li>・<strong>MG評価・最終評価</strong>: 評価基準が表示されます</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ステップ2: ユーザー追加 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-lg px-3 py-1">ステップ 2</Badge>
            <CardTitle>ユーザーを追加</CardTitle>
          </div>
          <CardDescription>評価対象者と評価者を登録します（管理者・MG評価者のみ）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">👥 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「ユーザー管理」をクリック</li>
              <li>「新しいユーザーを追加」ボタンをクリック</li>
              <li>ユーザー情報を入力
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>スタッフコード</strong>: ログインIDとして使用（例: 149）</li>
                  <li><strong>名前</strong>: フルネーム</li>
                  <li><strong>部署</strong>: 所属店舗名（例: Belle福島店）</li>
                  <li><strong>役割</strong>: 権限レベルを選択</li>
                  <li><strong>ランク</strong>: S / J / M から選択</li>
                  <li><strong>店長評価スキップ</strong>: チェックすると本人評価→MG評価へ直接進む</li>
                </ul>
              </li>
              <li>MG評価者の場合は「管轄店舗」を選択</li>
              <li>「作成」ボタンをクリック</li>
              <li>初期パスワードはスタッフコードと同じです</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">✨ ステータス管理</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>・<strong>在籍中</strong>: 通常の状態、評価割り当て対象</li>
              <li>・<strong>休職中</strong>: 一時的に評価対象外</li>
              <li>・<strong>退職</strong>: 評価対象外、データは保持</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ステップ3: 評価期間作成 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-lg px-3 py-1">ステップ 3</Badge>
            <CardTitle>評価期間を作成</CardTitle>
          </div>
          <CardDescription>いつからいつまでの評価かを設定します（管理者・MG評価者・店長評価者）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">📅 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価期間管理」をクリック</li>
              <li>「新しい評価期間を作成」ボタンをクリック</li>
              <li>評価期間情報を入力
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>期間名</strong>: 例「2024年度上期評価」</li>
                  <li><strong>開始日</strong>: 評価開始日</li>
                  <li><strong>終了日</strong>: 評価終了日</li>
                  <li><strong>評価テンプレート</strong>: ステップ1で作成したテンプレートを選択</li>
                </ul>
              </li>
              <li>「作成」ボタンをクリック</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* ステップ4: 評価を割り当て */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-lg px-3 py-1">ステップ 4</Badge>
            <CardTitle>評価を割り当て</CardTitle>
          </div>
          <CardDescription>誰を評価するかを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">✅ 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>「評価期間管理」ページで「評価を割り当て」ボタンをクリック</li>
              <li>店舗・ランクでフィルタリング可能</li>
              <li>評価対象のユーザーをチェックボックスで選択</li>
              <li>「割り当て」ボタンをクリック</li>
            </ol>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-semibold text-purple-900 mb-1">🔄 自動作成される評価</p>
            <div className="text-sm text-purple-800 space-y-2">
              <p><strong>通常フロー:</strong></p>
              <p>本人評価 → 店長評価 → MG評価 → 最終評価</p>
              <p className="mt-2"><strong>店長スキップ設定時:</strong></p>
              <p>本人評価 → MG評価 → 最終評価</p>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-semibold text-red-900 mb-1">🗑️ 割り当ての解除・削除</p>
            <ul className="text-sm text-red-800 space-y-1">
              <li>・評価期間一覧の「割り当て管理」ボタンをクリック</li>
              <li>・削除したい評価をチェックして「選択した評価を削除」</li>
              <li>・間違えて割り当てた場合に使用してください</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ステップ5: 評価実施 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-lg px-3 py-1">ステップ 5</Badge>
            <CardTitle>評価を実施</CardTitle>
          </div>
          <CardDescription>実際に評価を入力します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">📝 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>評価者としてログイン</li>
              <li>サイドバーの「評価実施」をクリック</li>
              <li>実施可能な評価がドロップダウンに表示されます</li>
              <li>各評価項目でA〜Eグレードを選択</li>
              <li>コメントを入力（任意）</li>
              <li>⚡ 入力は自動保存されます</li>
              <li>すべての項目を入力後、「評価を提出」ボタンをクリック</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">💡 評価者ごとの表示範囲</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>・<strong>スタッフ</strong>: 自分の本人評価のみ</li>
              <li>・<strong>店長評価者</strong>: 自店舗スタッフの店長評価 + 自分の本人評価</li>
              <li>・<strong>MG評価者</strong>: 管轄店舗スタッフのMG評価</li>
              <li>・<strong>管理者</strong>: すべての評価</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">✏️ 提出済み評価の編集</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>・「評価実施」ページの「提出済み評価」タブから編集可能</li>
              <li>・<strong>自分が提出した評価のみ</strong>編集できます</li>
              <li>・例: Aさんが本人評価 → Aさんのみ編集可能</li>
              <li>・例: Bさんが店長評価 → Bさんのみ編集可能</li>
              <li>・「評価結果」ページからも「編集」ボタンで遷移できます</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ステップ6: 結果確認 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-3 py-1">ステップ 6</Badge>
            <CardTitle>評価結果を確認</CardTitle>
          </div>
          <CardDescription>提出された評価を閲覧します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">📊 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価結果」をクリック</li>
              <li>権限に応じた評価が一覧表示されます</li>
              <li>評価をクリックして詳細を確認</li>
            </ol>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-1">⚠️ スタッフの閲覧制限</p>
            <p className="text-sm text-yellow-800">
              スタッフは自分の本人評価のみ閲覧可能です。店長評価・MG評価・最終評価は閲覧できません。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* よくある質問 */}
      <Card>
        <CardHeader>
          <CardTitle>❓ よくある質問</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q1. パスワードを忘れた場合は？</h3>
            <p className="text-sm text-gray-700">
              A. サイドバー下部の「パスワード変更」から自分で変更できます。管理者・MG評価者は「ユーザー管理」から他ユーザーのパスワードを再発行できます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q2. 店長がいないスタッフはどうすれば？</h3>
            <p className="text-sm text-gray-700">
              A. ユーザー編集画面で「店長評価をスキップ」にチェックを入れてください。本人評価→MG評価に直接進みます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q3. 退職者のデータはどうなる？</h3>
            <p className="text-sm text-gray-700">
              A. ステータスを「退職」に変更すると、評価割り当て対象から外れますが、過去のデータは保持されます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q4. MG評価者の管轄店舗を変更するには？</h3>
            <p className="text-sm text-gray-700">
              A. ユーザー管理でMG評価者を編集し、「管轄店舗」のチェックボックスで設定できます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q5. 評価基準が表示されないのはなぜ？</h3>
            <p className="text-sm text-gray-700">
              A. 本人評価と店長評価では評価基準は非表示です。MG評価・最終評価でのみ表示されます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q6. 提出済みの評価を修正したい</h3>
            <p className="text-sm text-gray-700">
              A. 「評価実施」ページの「提出済み評価」タブから、自分が提出した評価のみ編集できます。他人が提出した評価は編集できません。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q7. 間違って評価を割り当ててしまった</h3>
            <p className="text-sm text-gray-700">
              A. 「評価期間管理」ページで該当期間の「割り当て管理」ボタンから、評価を選択して削除できます。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* トラブルシューティング */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-900">🔧 トラブルシューティング</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">評価対象者が表示されない</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>原因</strong>: ユーザーのステータスが「在籍中」以外、または部署名が一致していない可能性があります。
            </p>
            <p className="text-sm text-gray-700">
              <strong>解決策</strong>: ユーザー管理でステータスと部署名を確認してください。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">店長評価者に他店舗のスタッフが表示される</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>原因</strong>: 部署名が完全一致していない可能性があります。
            </p>
            <p className="text-sm text-gray-700">
              <strong>解決策</strong>: 店長とスタッフの部署名が完全に同じか確認してください（スペースの有無など）。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">MG評価者に評価が表示されない</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>原因</strong>: 管轄店舗が設定されていない可能性があります。
            </p>
            <p className="text-sm text-gray-700">
              <strong>解決策</strong>: ユーザー管理でMG評価者の「管轄店舗」を設定してください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
