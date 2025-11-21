# 人事考課SAAS

多段階評価システムを備えた人事考課管理プラットフォーム

## 主な機能

- **多段階評価フロー**: 本人評価 → 店長評価 → MG評価
- **カスタマイズ可能な評価項目**: 採点項目と配点を自由に設定
- **5段階評価システム**: 柔軟な評価基準
- **結果の可視化**: グラフとレポートで評価結果を表示
- **中規模組織対応**: 50〜500名の組織に最適化

## 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS
- **UIコンポーネント**: shadcn/ui
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **デプロイ**: Vercel

## 開発環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でアカウント作成（無料）
2. 新規プロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、Supabaseの認証情報を設定：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. データベーススキーマの適用

Supabaseダッシュボードの「SQL Editor」で`supabase/schema.sql`の内容を実行

### 5. 開発サーバーの起動

```bash
npm run dev
```

### その他のコマンド

```bash
# ビルド
npm run build

# 本番サーバーの起動
npm start

# Lint
npm run lint
```

## プロジェクト構造

```
jinjikouka-saas/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # ルートレイアウト
│   ├── page.tsx         # トップページ
│   └── globals.css      # グローバルスタイル
├── components/          # Reactコンポーネント
├── lib/                 # ユーティリティ関数
├── public/              # 静的ファイル
└── types/               # TypeScript型定義
```

## 開発原則

- **YAGNI**: 今必要じゃない機能は作らない
- **DRY**: 同じコードを繰り返さない
- **KISS**: シンプルに保つ

## ライセンス

Private
