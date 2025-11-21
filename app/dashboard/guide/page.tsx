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

      {/* ステップ1: テンプレート作成 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-lg px-3 py-1">ステップ 1</Badge>
            <CardTitle>評価テンプレートを作成</CardTitle>
          </div>
          <CardDescription>評価項目と配点を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">📋 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価項目管理」をクリック</li>
              <li>「新しいテンプレートを作成」ボタンをクリック</li>
              <li>テンプレート名と説明を入力
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li>例: 「2024年一般社員用評価」</li>
                  <li>説明: 「営業・事務スタッフ向けの標準評価」</li>
                </ul>
              </li>
              <li>作成したテンプレートを選択</li>
              <li>「評価項目を追加」で各項目を設定
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>項目名</strong>: 例「業務遂行能力」</li>
                  <li><strong>説明</strong>: 項目の詳細説明</li>
                  <li><strong>配点</strong>: 例「30」（合計100点になるように調整）</li>
                  <li><strong>採点基準</strong>: 例「5.0: 優れている / 3.0: 標準的 / 1.0: 改善が必要」</li>
                </ul>
              </li>
              <li>必要な項目をすべて追加（通常3〜5項目）</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">💡 ポイント</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>・配点の合計は100点にする必要はありませんが、分かりやすいです</li>
              <li>・採点基準を明確にすると、評価者が迷わず評価できます</li>
              <li>・テンプレートは何度でも再利用できます</li>
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
          <CardDescription>評価対象者と評価者を登録します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">👥 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「ユーザー管理」をクリック</li>
              <li>「新しいユーザーを追加」ボタンをクリック</li>
              <li>ユーザー情報を入力
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>メールアドレス</strong>: ログインに使用</li>
                  <li><strong>名前</strong>: フルネーム</li>
                  <li><strong>部署</strong>: 所属部署名</li>
                  <li><strong>役割</strong>: 権限レベルを選択
                    <ul className="list-disc list-inside ml-6 mt-1">
                      <li><strong>admin</strong>: 全機能にアクセス可能</li>
                      <li><strong>mg</strong>: 全体の評価を閲覧・実施可能</li>
                      <li><strong>manager (店長)</strong>: 自部署の評価を実施可能</li>
                      <li><strong>staff</strong>: 自分の評価のみ実施可能</li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li>「作成」ボタンをクリック</li>
              <li>⚠️ <strong>重要</strong>: 自動生成されたパスワードをメモして、ユーザーに伝える</li>
            </ol>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-1">⚠️ 注意</p>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>・パスワードは一度しか表示されません！必ずメモしてください</li>
              <li>・パスワードを忘れた場合は「パスワード再発行」で新しいパスワードを発行できます</li>
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
          <CardDescription>いつからいつまでの評価かを設定します</CardDescription>
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
              <li>作成された評価期間のステータスを「実施中」に変更（必要に応じて）</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">💡 ステータスについて</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>・<strong>下書き</strong>: 準備中、まだ評価は開始されていない</li>
              <li>・<strong>実施中</strong>: 評価が実施可能な状態</li>
              <li>・<strong>完了</strong>: 評価期間が終了</li>
            </ul>
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
              <li>「評価期間管理」ページで、対象の評価期間の行にある「評価を割り当て」ボタンをクリック</li>
              <li>評価対象のユーザーをチェックボックスで選択
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li>「全員を選択」で一括選択も可能</li>
                  <li>各ユーザーの名前、メール、部署、役割が表示されます</li>
                </ul>
              </li>
              <li>「割り当て」ボタンをクリック</li>
              <li>システムが自動的に各ユーザーに3段階の評価を作成します
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>本人評価 (self)</strong>: 評価対象者が自己評価</li>
                  <li><strong>店長評価 (manager)</strong>: 店長が評価</li>
                  <li><strong>MG評価 (mg)</strong>: MGが最終評価</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-green-900 mb-1">✨ 自動作成される評価</p>
            <p className="text-sm text-green-800">
              例えば田中さんを選択すると、田中さん用の「本人評価」「店長評価」「MG評価」の3つが自動的に作成されます。
            </p>
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
              <li>評価者としてログイン（本人、店長、MGのいずれか）</li>
              <li>サイドバーの「評価実施」をクリック</li>
              <li>実施可能な評価が自動的に表示されます</li>
              <li>ドロップダウンから評価を選択</li>
              <li>各評価項目にスコアとコメントを入力
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li><strong>評価点</strong>: 1.0〜5.0（小数点1位まで）例: 4.5</li>
                  <li><strong>コメント</strong>: 評価の理由や詳細を記入</li>
                  <li>⚡ <strong>自動保存</strong>: 入力すると自動的にデータベースに保存されます</li>
                </ul>
              </li>
              <li>すべての項目を入力後、「評価を提出」ボタンをクリック</li>
              <li>⚠️ 提出後は編集できなくなります</li>
            </ol>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-semibold text-purple-900 mb-1">🔄 評価フロー</p>
            <ol className="text-sm text-purple-800 space-y-1">
              <li>1. <strong>本人評価</strong>: スタッフが自己評価を入力</li>
              <li>2. <strong>店長評価</strong>: 店長が部下を評価</li>
              <li>3. <strong>MG評価</strong>: MGが最終評価を実施</li>
            </ol>
            <p className="text-sm text-purple-800 mt-2">
              この順番で評価を進めることで、多角的な評価が可能になります。
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">💡 総合評価の計算</p>
            <p className="text-sm text-blue-800">
              総合スコアは各項目のスコアを配点で加重平均して自動計算されます。<br/>
              例: 業務遂行能力（4.5点、配点30）+ コミュニケーション（4.0点、配点20）→ 総合スコア = (4.5×30 + 4.0×20) / (30+20) = 4.3
            </p>
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
          <CardDescription>提出された評価を閲覧・出力します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">📊 手順</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>サイドバーの「評価一覧」をクリック</li>
              <li>提出された評価が一覧表示されます
                <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                  <li>権限に応じて閲覧可能な評価が自動的にフィルタリングされます</li>
                  <li><strong>staff</strong>: 自分の評価のみ</li>
                  <li><strong>manager</strong>: 自部署の評価</li>
                  <li><strong>mg/admin</strong>: すべての評価</li>
                </ul>
              </li>
              <li>評価をクリックして詳細を確認</li>
              <li>「PDFエクスポート」ボタンで評価結果をPDF出力可能</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-green-900 mb-1">📄 PDF出力</p>
            <p className="text-sm text-green-800">
              評価結果はPDF形式で出力できます。面談資料や保管用としてご活用ください。
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
              A. 管理者が「ユーザー管理」ページで該当ユーザーを編集し、「パスワード再発行」ボタンから新しいパスワードを発行できます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q2. 提出した評価を修正できますか？</h3>
            <p className="text-sm text-gray-700">
              A. 一度提出した評価は編集できません。提出前に内容をよく確認してください。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q3. 評価の進捗状況を確認するには？</h3>
            <p className="text-sm text-gray-700">
              A. 「評価一覧」ページで、ステータス（提出済み/未提出）を確認できます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q4. 評価は自動保存されますか？</h3>
            <p className="text-sm text-gray-700">
              A. はい。スコアやコメントを入力すると、リアルタイムで自動的にデータベースに保存されます。ブラウザを閉じても入力内容は保持されます。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Q5. 同じテンプレートを複数の評価期間で使えますか？</h3>
            <p className="text-sm text-gray-700">
              A. はい。一度作成したテンプレートは何度でも再利用できます。
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
            <h3 className="font-semibold text-gray-900 mb-1">「評価の取得に失敗しました」と表示される</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>原因</strong>: まだ評価が割り当てられていないか、ログインユーザーに実施可能な評価がありません。
            </p>
            <p className="text-sm text-gray-700">
              <strong>解決策</strong>: 評価期間を作成し、「評価を割り当て」で対象ユーザーを選択してください。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">ログインできない</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>原因</strong>: メールアドレスまたはパスワードが間違っています。
            </p>
            <p className="text-sm text-gray-700">
              <strong>解決策</strong>: 管理者にパスワード再発行を依頼してください。
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">評価が表示されない</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>原因</strong>: 権限によって閲覧できる評価が制限されています。
            </p>
            <p className="text-sm text-gray-700">
              <strong>解決策</strong>: 自分の権限で閲覧可能な範囲を確認してください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
