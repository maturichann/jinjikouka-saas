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

      {/* 評価フロー概要 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">評価の全体フロー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>通常フロー:</strong> 本人評価 → 店長評価 → MG評価 → 最終評価</p>
            <p><strong>店長スキップ時:</strong> 本人評価 → MG評価 → 最終評価</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">役割</th>
                  <th className="text-center py-2 px-3">ユーザー管理</th>
                  <th className="text-center py-2 px-3">テンプレート</th>
                  <th className="text-center py-2 px-3">評価期間</th>
                  <th className="text-center py-2 px-3">評価実施</th>
                  <th className="text-center py-2 px-3">評価結果</th>
                  <th className="text-center py-2 px-3">ランキング</th>
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
                  <td className="text-center">全て</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-semibold">MG評価者</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">管轄店舗</td>
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
                  <td className="text-center">❌</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">スタッフ</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">本人のみ</td>
                  <td className="text-center">本人のみ</td>
                  <td className="text-center">❌</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========== 管理者向け ========== */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold border-b-4 border-red-500 pb-2 inline-block">管理者向けガイド</h2>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-red-600 text-lg px-3 py-1">管理者</Badge>
            <CardTitle>評価テンプレートを作成</CardTitle>
          </div>
          <CardDescription>評価項目と配点を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価項目管理」をクリック</li>
              <li>「新しいテンプレートを作成」ボタンをクリック</li>
              <li>テンプレート名と説明を入力（例: 「2024年Sランク用評価」）</li>
              <li>作成したテンプレートを選択</li>
              <li>「評価項目を追加」で各項目を設定
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>項目名</strong>: 例「業務遂行能力」</li>
                  <li><strong>説明</strong>: 項目の詳細説明</li>
                  <li><strong>カテゴリ・サブカテゴリ</strong>: 項目の分類（業績評価、職務評価、行動評価など）</li>
                  <li><strong>配点</strong>: 例「30」（合計100点になるように調整）</li>
                  <li><strong>グレード段階数</strong>: 項目ごとにA〜Eの有効グレード数をカスタマイズ可能</li>
                  <li><strong>採点基準</strong>: 各グレード（A〜E）ごとの基準テキストと配点を設定</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-1">評価基準の表示ルール</p>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>・<strong>本人評価・店長評価</strong>: 評価基準は非表示（「本人非表示」設定時）</li>
              <li>・<strong>MG評価・最終評価</strong>: 評価基準が表示されます</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-red-600 text-lg px-3 py-1">管理者</Badge>
            <CardTitle>ユーザーを管理</CardTitle>
          </div>
          <CardDescription>評価対象者と評価者を登録・管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">ユーザー追加手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「ユーザー管理」をクリック</li>
              <li>「新しいユーザーを追加」ボタンをクリック</li>
              <li>ユーザー情報を入力
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>スタッフコード</strong>: ログインIDとして使用（例: 149）</li>
                  <li><strong>名前</strong>: フルネーム</li>
                  <li><strong>部署</strong>: 所属店舗名（例: Belle福島店）</li>
                  <li><strong>役割</strong>: 管理者 / MG評価者 / 店長評価者 / スタッフ</li>
                  <li><strong>ランク</strong>: S / J / M から選択</li>
                  <li><strong>店長評価スキップ</strong>: チェックすると本人評価→MG評価へ直接進む</li>
                </ul>
              </li>
              <li>MG評価者の場合は「管轄店舗」を選択</li>
              <li>初期パスワードはスタッフコードと同じです</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">便利な機能</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>・<strong>店舗フィルター</strong>: 一覧を店舗で絞り込み可能</li>
              <li>・<strong>PW再発行</strong>: パスワードを任意の値にリセット</li>
              <li>・<strong>ステータス変更</strong>: 在籍中 / 休職中 / 退職 で管理</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-red-600 text-lg px-3 py-1">管理者</Badge>
            <CardTitle>評価期間の作成・確定</CardTitle>
          </div>
          <CardDescription>評価期間の設定から確定までの流れ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">期間作成</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価期間管理」をクリック</li>
              <li>「新しい評価期間を作成」ボタンをクリック</li>
              <li>必要情報を入力
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>期間名</strong>: 例「2024年度上期評価」</li>
                  <li><strong>開始日・終了日</strong></li>
                  <li><strong>評価テンプレート</strong>: 作成済みのテンプレートを選択</li>
                  <li><strong>前期メンバーをコピー</strong>: 既存期間のメンバー構成をコピー（退職者は自動除外）</li>
                </ul>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">メンバー割り当て</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>「評価を割り当て」ボタンをクリック</li>
              <li>店舗・ランクでフィルタリング</li>
              <li>対象ユーザーをチェックして割り当て</li>
            </ol>
            <p className="text-sm text-gray-500 mt-2">各ユーザーに本人評価・店長評価・MG評価・最終評価が自動作成されます</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">期間ステータス</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>・<strong>下書き</strong>: 準備中。割り当てを完了してからステータスを変更</li>
              <li>・<strong>実施中</strong>: 評価が進行中。「評価を確定」ボタンが表示される</li>
              <li>・<strong>完了</strong>: 全評価がロックされ編集不可に</li>
            </ul>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-semibold text-red-900 mb-1">評価確定について</p>
            <ul className="text-sm text-red-800 space-y-1">
              <li>・「実施中」期間の「評価を確定」ボタンで確定処理</li>
              <li>・全員の最終評価が提出済みかを自動チェック</li>
              <li>・未提出者がいる場合は名前付きでアラート表示</li>
              <li>・確定後は全評価が編集不可（閲覧のみ）になります</li>
              <li>・この操作は取り消せません</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-1">割り当て管理</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>・「割り当て管理」ボタンで割り当て済みの評価一覧を表示</li>
              <li>・評価者ごとにグループ化されて表示</li>
              <li>・チェックボックスで複数選択して一括削除可能</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-red-600 text-lg px-3 py-1">管理者</Badge>
            <CardTitle>最終評価の実施</CardTitle>
          </div>
          <CardDescription>全ステージの評価を参照して最終的な評価を確定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">最終評価の特別項目</h3>
            <p className="text-sm text-gray-700 mb-2">最終評価ステージでは、通常の評価項目に加えて以下を入力します:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li><strong>総評コメント</strong>: 全ステージを踏まえた総合コメント</li>
              <li><strong>総合評価</strong>: 最終的な評価グレード（A〜E）</li>
              <li><strong>最終決定</strong>: 配置・処遇等の決定グレード（A〜E）</li>
            </ul>
            <p className="text-sm text-gray-500 mt-2">いずれも「保留」にして後で決定することが可能です</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm font-semibold text-purple-900 mb-1">参照できる評価</p>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>・本人評価、店長評価、MG評価の結果を参照しながら入力</li>
              <li>・前期の最終評価も参照可能</li>
              <li>・「参照を隠す」ボタンで表示/非表示を切り替え</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-red-600 text-lg px-3 py-1">管理者</Badge>
            <CardTitle>評価結果・ランキング</CardTitle>
          </div>
          <CardDescription>結果の確認、PDF出力、ランキングの閲覧</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">評価結果ページ</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>全スタッフの全ステージの評価を閲覧</li>
              <li>部署フィルターで絞り込み可能</li>
              <li>「編集」ボタンから提出済み評価を修正可能（確定済み期間を除く）</li>
              <li>「比較」ボタンで同一人物の全ステージ評価を横並び比較</li>
              <li>PDF出力: 一覧表のPDF / 全員一括PDF</li>
              <li>最終評価の一括「確定」処理（確定するとスタッフに閲覧権限が付与される）</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">ランキングページ</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>最終評価のスコア順にランキング表示</li>
              <li>前期比（スコアの増減）を矢印で表示</li>
              <li>総合評価・最終決定のグレード列を表示</li>
              <li>各スタッフの総評コメントを表示</li>
              <li>PDF出力可能</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ========== MG向け ========== */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold border-b-4 border-blue-500 pb-2 inline-block">MG評価者向けガイド</h2>
      </div>

      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-600 text-lg px-3 py-1">MG</Badge>
            <CardTitle>MG評価の実施</CardTitle>
          </div>
          <CardDescription>管轄店舗スタッフのMG評価を行います</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価実施」をクリック</li>
              <li>管轄店舗のMG評価がドロップダウンに表示されます</li>
              <li>部署フィルターで店舗を絞り込み可能</li>
              <li>各評価項目でグレードを選択しコメントを入力</li>
              <li>入力は自動保存されます</li>
              <li>すべての項目を入力後「評価を提出」をクリック</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-1">参照できる評価</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>・本人評価と店長評価の結果を参照しながら入力</li>
              <li>・各項目のグレード・スコア・コメントが表示されます</li>
              <li>・「参照を隠す」ボタンで表示を切り替え可能</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-1">MG固有の機能</p>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>・MG評価では評価基準テキストが表示されます</li>
              <li>・管轄店舗スタッフの提出済み評価も編集可能</li>
              <li>・ランキングページで管轄店舗のランキングを閲覧可能</li>
              <li>・評価結果ページでPDF出力可能</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-600 text-lg px-3 py-1">MG</Badge>
            <CardTitle>テンプレート・ユーザー・期間管理</CardTitle>
          </div>
          <CardDescription>管理者と同じ管理機能が利用できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-700 space-y-2">
            <p>MG評価者は以下の管理機能にアクセスできます:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>ユーザー管理</strong>: スタッフの追加・編集・パスワード再発行</li>
              <li><strong>評価項目管理</strong>: テンプレートの作成・編集</li>
              <li><strong>評価期間管理</strong>: 期間の作成・割り当て・確定</li>
            </ul>
            <p className="mt-2">操作方法は管理者向けガイドと同じです。</p>
          </div>
        </CardContent>
      </Card>

      {/* ========== 店長向け ========== */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold border-b-4 border-green-500 pb-2 inline-block">店長評価者向けガイド</h2>
      </div>

      <Card className="border-green-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-600 text-lg px-3 py-1">店長</Badge>
            <CardTitle>店長評価の実施</CardTitle>
          </div>
          <CardDescription>自店舗スタッフの店長評価と自分の本人評価を行います</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価実施」をクリック</li>
              <li>自分の本人評価と、自店舗スタッフの店長評価が表示されます</li>
              <li>各評価項目でグレードを選択しコメントを入力</li>
              <li>入力は自動保存されます</li>
              <li>すべての項目を入力後「評価を提出」をクリック</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">参照できる評価</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>・店長評価の際、対象スタッフの本人評価結果を参照可能</li>
              <li>・各項目のグレード・スコア・コメントが表示されます</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-1">注意</p>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>・店長評価では評価基準テキストは非表示です</li>
              <li>・提出済みの自分の評価と自店舗スタッフの店長評価は編集可能です</li>
              <li>・評価結果ページで自店舗の評価結果を閲覧できます</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-600 text-lg px-3 py-1">店長</Badge>
            <CardTitle>評価期間管理</CardTitle>
          </div>
          <CardDescription>店長も評価期間の作成・割り当てが可能です</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700 space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>新しい評価期間の作成</li>
              <li>評価の割り当て（店舗・ランクでフィルタリング可能）</li>
              <li>割り当て管理（評価の削除）</li>
              <li>前期メンバーコピーによる効率的な割り当て</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ========== スタッフ向け ========== */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold border-b-4 border-gray-500 pb-2 inline-block">スタッフ向けガイド</h2>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-3 py-1">スタッフ</Badge>
            <CardTitle>本人評価の実施</CardTitle>
          </div>
          <CardDescription>自分自身の評価を入力して提出します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>スタッフコードとパスワードでログイン</li>
              <li>サイドバーの「評価実施」をクリック</li>
              <li>自分の本人評価がドロップダウンに表示されます</li>
              <li>各評価項目でグレード（A〜E）を選択</li>
              <li>コメントを入力（任意）</li>
              <li>入力は自動保存されるため、途中で画面を閉じても大丈夫です</li>
              <li>すべての項目を入力後「評価を提出」をクリック</li>
            </ol>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-1">注意事項</p>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>・本人評価では評価基準テキストは表示されません</li>
              <li>・提出後も「提出済み評価」タブから修正・再提出が可能です</li>
              <li>・ただし期間が確定済みの場合は閲覧のみとなります</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-3 py-1">スタッフ</Badge>
            <CardTitle>評価結果の確認</CardTitle>
          </div>
          <CardDescription>提出済みの自分の評価を確認します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-700 space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>サイドバーの「評価結果」から自分の本人評価を閲覧できます</li>
              <li>管理者が最終評価を「確定」すると、最終評価のスコアも閲覧可能になります</li>
              <li>ただし最終評価の総評コメント・詳細コメントは閲覧できません</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-1">パスワード変更</p>
            <p className="text-sm text-blue-800">
              サイドバー下部の「パスワード変更」からいつでも変更できます。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ========== 共通: 評価入力の詳細 ========== */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold border-b-4 border-purple-500 pb-2 inline-block">共通: 評価入力の詳しい使い方</h2>
      </div>

      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle>評価入力画面の機能</CardTitle>
          <CardDescription>全ての役割に共通する評価入力の操作方法</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">カテゴリ別表示</h3>
            <p className="text-sm text-gray-700">
              評価項目はカテゴリ（業績評価、職務評価、行動評価など）ごとに分類表示されます。
              各項目には番号が付与されており、会議での参照が容易です。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">進捗表示</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>プログレスバーで入力進捗が%で表示されます</li>
              <li>「未入力の項目へジャンプ」リンクで未入力項目に自動スクロール</li>
              <li>保留中の項目は「保留○件」として表示</li>
              <li>コメントのみ（グレード未選択）の項目も別途サマリー表示</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">保留機能</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>各項目の「保留」ボタンで、グレード選択を一時保留にできます</li>
              <li>「保留解除」で再度グレード選択が可能</li>
              <li>保留項目がある評価は一覧でオレンジ色で表示されます</li>
              <li>提出前にすべての保留を解除する必要はありません</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">自動保存</h3>
            <p className="text-sm text-gray-700">
              グレード選択・コメント入力は自動保存されます。途中で画面を閉じても次回アクセス時に続きから入力できます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">提出済み評価の編集</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>「提出済み評価」タブから再編集・再提出が可能</li>
              <li>「評価結果」ページの「編集」ボタンからも遷移可能</li>
              <li>管理者・MGは他者が提出した評価も編集可能</li>
              <li>期間確定済みの評価は閲覧のみとなります</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ========== FAQ ========== */}
      <Card>
        <CardHeader>
          <CardTitle>よくある質問</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q1. パスワードを忘れた場合は？</h3>
            <p className="text-sm text-gray-700">
              A. サイドバー下部の「パスワード変更」から自分で変更できます。管理者・MG評価者は「ユーザー管理」の「PW再発行」ボタンで任意のパスワードにリセットできます。
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
              A. ステータスを「退職」に変更すると、評価割り当て対象から外れますが、過去のデータは保持されます。前期メンバーコピー時も自動で除外されます。
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
              A. 本人評価と店長評価では評価基準は非表示です。MG評価・最終評価でのみ表示されます。テンプレートの「本人非表示」設定に基づきます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q6. 提出済みの評価を修正したい</h3>
            <p className="text-sm text-gray-700">
              A. 「評価実施」ページの「提出済み評価」タブ、または「評価結果」ページの「編集」ボタンから修正できます。自分の評価はいつでも編集可能。管理者・MGは他者の評価も編集可能。ただし期間確定済みの評価は編集できません。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q7. 間違って評価を割り当ててしまった</h3>
            <p className="text-sm text-gray-700">
              A. 「評価期間管理」ページで該当期間の「割り当て管理」ボタンから、評価を選択して削除できます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q8. 確定済みの評価を修正したい</h3>
            <p className="text-sm text-gray-700">
              A. 確定済み期間の評価は閲覧のみ可能で編集できません。確定前に内容を十分確認してください。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q9. 前期のメンバーをそのまま使いたい</h3>
            <p className="text-sm text-gray-700">
              A. 新しい評価期間の作成時に「前期メンバーをコピー」でコピー元の期間を選択してください。退職者は自動で除外されます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q10. 評価項目を「保留」にするには？</h3>
            <p className="text-sm text-gray-700">
              A. 評価入力画面で各項目の「保留」ボタンをクリックしてください。保留中はグレード選択が無効になります。「保留解除」で再開できます。保留項目は評価一覧でオレンジ色で表示されます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q11. 「総合評価」「最終決定」とは？</h3>
            <p className="text-sm text-gray-700">
              A. 最終評価ステージでのみ表示される項目です。「総合評価」は全項目を総合したグレード、「最終決定」は配置・処遇の決定グレードです。いずれもA〜Eで選択し、保留も可能です。ランキングページにも反映されます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q12. 前のステージの評価を確認しながら入力したい</h3>
            <p className="text-sm text-gray-700">
              A. 評価入力画面で前ステージの評価結果が自動表示されます。最終評価では前期の最終評価も参照可能です。「参照を隠す」ボタンで非表示にもできます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q13. ランキングが見られません</h3>
            <p className="text-sm text-gray-700">
              A. ランキングページは管理者とMG評価者のみアクセス可能です。MGは管轄店舗のみ、管理者は全員のランキングを閲覧できます。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* トラブルシューティング */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-900">トラブルシューティング</CardTitle>
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

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">確定済みの評価が編集できない</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>原因</strong>: 評価期間が「完了」ステータスに確定されています。
            </p>
            <p className="text-sm text-gray-700">
              <strong>解決策</strong>: 確定済み期間の評価はロックされるため、確定前に内容を十分確認してください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
