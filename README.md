# 人事考課SAAS

クラウドベースの人事評価管理システム

## 📋 プロジェクト概要

従業員の評価を3段階（本人評価 → 店長評価 → MG評価）で管理するSaaSアプリケーション。
部署別・評価期間別のフィルタリング、PDF出力機能を搭載。

## 🚀 技術スタック

- **フロントエンド**: Next.js 15 (App Router)
- **UI**: React, TypeScript, Tailwind CSS, shadcn/ui
- **データベース**: Supabase (PostgreSQL)
- **認証**: カスタム認証（スタッフコードベース）
- **デプロイ**: Vercel
- **PDF**: jsPDF, jspdf-autotable

## ✨ 主要機能

### 認証システム
- スタッフコードベースのログイン
- パスワード = スタッフコード
- 4段階の権限管理（admin, mg, manager, staff）

### 評価管理
- テンプレート作成・管理
- 評価項目の追加・編集（配点設定）
- 評価期間の作成・管理
- 3段階評価フロー（本人→店長→MG）
- リアルタイム自動保存

### 権限別アクセス制御
- **admin（管理者）**: 全機能アクセス可能
- **mg（MG）**: 全評価閲覧・MG評価実施
- **manager（店長）**: 自部署の評価閲覧・店長評価実施
- **staff（スタッフ）**: 自分の本人評価のみ実施・閲覧

### PDF出力機能
- 個別評価のPDFエクスポート
- 一括PDFエクスポート
- 部署別フィルタリング
- 評価期間別フィルタリング
- フィルター後のPDFエクスポート

### レポート・分析
- 評価一覧表示
- 一元管理ビュー（従業員ごとの3段階評価を並べて比較）
- 総合スコア計算（加重平均）
- ステータス管理（pending/submitted）

## 🛠️ セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/maturichann/jinjikouka-saas.git
cd jinjikouka-saas
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabaseデータベースのセットアップ

Supabase SQL Editorで以下のSQLファイルを順番に実行：

```bash
# 1. ユーザーテーブル
supabase/users-schema.sql

# 2. テンプレートテーブル
supabase/templates-schema.sql

# 3. 評価期間テーブル
supabase/periods-schema.sql

# 4. 評価テーブル
supabase/evaluations-schema.sql

# 5. スタッフコード追加
supabase/add-staff-code.sql

# 6. 全スタッフ登録
supabase/insert-all-staff.sql

# 7. created_by カラムをNULL許可に変更（重要）
ALTER TABLE public.evaluation_templates ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.evaluation_periods ALTER COLUMN created_by DROP NOT NULL;
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## 🗄️ データベース構造

### テーブル一覧

- `users` - ユーザー（全スタッフ）
- `evaluation_templates` - 評価テンプレート
- `evaluation_items` - 評価項目
- `evaluation_periods` - 評価期間
- `evaluations` - 評価（3段階）
- `evaluation_scores` - 評価スコア

### 重要なリレーション

```
users (スタッフ)
  ↓
evaluations (評価: self/manager/mg)
  ↓
evaluation_scores (スコア)
  ↓
evaluation_items (評価項目)
```

## 📝 ログイン情報

### テストアカウント

**管理者：**
- スタッフコード: `006`
- パスワード: `admin123` （初期値から変更されている可能性あり）

**一般スタッフ：**
- スタッフコード: `149`, `140`, `129` など
- パスワード: スタッフコードと同じ

## 🚢 デプロイ

### Vercelへのデプロイ

1. GitHubにプッシュ
```bash
git add .
git commit -m "your message"
git push
```

2. Vercelが自動でデプロイ
3. 環境変数を設定（Supabaseの認証情報）

### 本番URL

https://jinjikouka-saas.vercel.app

## 🔧 重要な設定・注意点

### Row Level Security (RLS)

開発用に**無効化**されています：

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_templates DISABLE ROW LEVEL SECURITY;
-- 他のテーブルも同様
```

**本番環境では有効化を推奨**

### created_by フィールド

テンプレートと評価期間の `created_by` は**NULL許可**にする必要があります：

```sql
ALTER TABLE public.evaluation_templates ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.evaluation_periods ALTER COLUMN created_by DROP NOT NULL;
```

### パスワードハッシュ

現在は**平文**で保存されています。
本番環境では bcrypt 等を使用してハッシュ化を推奨。

## 🐛 トラブルシューティング

### テンプレート作成エラー

**エラー**: 「テンプレートの作成に失敗しました」

**解決策**:
```sql
ALTER TABLE public.evaluation_templates ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.evaluation_periods ALTER COLUMN created_by DROP NOT NULL;
```

### ログインできない

1. Supabaseで `users` テーブルを確認
2. `staff_code` と `password_hash` が正しいか確認
3. ブラウザのキャッシュをクリア（Cmd+Shift+R）

### ビルドエラー

```bash
# キャッシュをクリアして再ビルド
rm -rf .next
npm run build
```

## 📁 プロジェクト構造

```
jinjikouka-saas/
├── app/                    # Next.js App Router
│   ├── dashboard/          # ダッシュボード（認証必須）
│   │   ├── evaluations/    # 評価実施ページ
│   │   ├── guide/          # 使い方ガイド
│   │   ├── periods/        # 評価期間管理
│   │   ├── results/        # 評価結果・PDF出力
│   │   ├── templates/      # テンプレート管理
│   │   ├── users/          # ユーザー管理
│   │   └── layout.tsx      # ダッシュボードレイアウト
│   ├── login/              # ログインページ
│   └── page.tsx            # トップページ（/へリダイレクト）
├── components/             # Reactコンポーネント
│   ├── dashboard/          # ダッシュボード用コンポーネント
│   └── ui/                 # shadcn/ui コンポーネント
├── contexts/               # React Context
│   └── auth-context.tsx    # 認証コンテキスト
├── lib/                    # ユーティリティ
│   ├── pdf-export.ts       # PDF生成ロジック
│   └── supabase/           # Supabase設定
├── supabase/               # SQLスキーマ
│   ├── schema.sql          # メインスキーマ
│   ├── users-schema.sql    # ユーザーテーブル
│   ├── templates-schema.sql # テンプレート
│   ├── periods-schema.sql  # 評価期間
│   ├── evaluations-schema.sql # 評価
│   ├── add-staff-code.sql  # スタッフコード追加
│   └── insert-all-staff.sql # 全スタッフ登録
└── README.md               # このファイル
```

## 🎯 使い方

### 1. テンプレート作成

1. 「テンプレート管理」へ
2. 「新しいテンプレートを追加」
3. 評価項目を追加（名前、説明、配点、評価基準）

### 2. ユーザー管理

1. 「ユーザー管理」へ
2. スタッフの追加・編集・削除
3. 権限の変更（admin/mg/manager/staff）

### 3. 評価期間作成

1. 「評価期間管理」へ
2. 「新しい評価期間を追加」
3. テンプレートを選択
4. 対象者にチェックして「割り当て」

### 4. 評価実施

1. 「評価実施」へ
2. 評価を選択
3. 各項目にスコアとコメントを入力
4. 自動保存される
5. 「提出」で確定

### 5. 結果確認とPDF出力

1. 「評価一覧」へ
2. 部署・評価期間でフィルタリング
3. 「フィルター後のPDFエクスポート」でダウンロード

## 🔄 セッション再開方法

Claude Codeのセッションが切れた場合：

```bash
# プロジェクトディレクトリに移動
cd /Users/sakaitaichi/jinjikouka-saas

# Claude Codeで以下のように伝える
「このプロジェクトの続きから作業したいです。
最近のコミット履歴を確認して、現在の状態を教えてください。」
```

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📄 開発原則

- **YAGNI (You Aren't Gonna Need It)**: 今必要じゃない機能は作らない
- **DRY (Don't Repeat Yourself)**: 同じコードを繰り返さない
- **KISS (Keep It Simple Stupid)**: シンプルに保つ

## 👨‍💻 開発者

開発・保守: Claude Code + Human

---

最終更新: 2025-11-22
