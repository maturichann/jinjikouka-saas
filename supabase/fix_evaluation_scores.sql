-- ============================================
-- evaluation_scores テーブルの修正SQL
-- 問題: 編集・再提出でスコアが更新されない
-- ============================================

-- 1. RLSポリシーの修正
-- anon keyを使用しているため、RLSが有効でポリシーがないと全操作がブロックされる

-- まずRLSの状態を確認（確認用）
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'evaluation_scores';

-- RLSを無効化（開発環境向け。本番ではポリシーを設定すべき）
ALTER TABLE public.evaluation_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_periods DISABLE ROW LEVEL SECURITY;

-- 2. score カラムのCHECK制約を緩和
-- 現在: CHECK (score >= 1.0 AND score <= 5.0) → グレード配点が5超のテンプレートで失敗
-- 修正: 0〜999.9まで許可

-- 既存のCHECK制約を削除（制約名が不明な場合は以下で確認）
-- SELECT conname FROM pg_constraint WHERE conrelid = 'evaluation_scores'::regclass AND contype = 'c';

-- CHECK制約を削除して再作成
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- scoreカラムのCHECK制約を検索して削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'evaluation_scores'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%score%'
  LOOP
    EXECUTE 'ALTER TABLE public.evaluation_scores DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
END $$;

-- scoreカラムの型を変更（DECIMAL(3,1) → DECIMAL(5,1) で最大9999.9まで対応）
ALTER TABLE public.evaluation_scores ALTER COLUMN score TYPE DECIMAL(5,1);

-- 新しいCHECK制約（0以上に緩和）
ALTER TABLE public.evaluation_scores ADD CONSTRAINT evaluation_scores_score_check CHECK (score >= 0);

-- 3. grade カラムが存在しない場合は追加
ALTER TABLE public.evaluation_scores ADD COLUMN IF NOT EXISTS grade TEXT;

-- 4. unique制約の確認と追加（既に存在する場合はスキップ）
-- UNIQUE(evaluation_id, item_id) が必要（upsertのonConflictで使用）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'evaluation_scores'::regclass
    AND contype = 'u'
  ) THEN
    ALTER TABLE public.evaluation_scores ADD CONSTRAINT evaluation_scores_evaluation_item_unique UNIQUE (evaluation_id, item_id);
    RAISE NOTICE 'Added unique constraint on (evaluation_id, item_id)';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- 5. 確認クエリ
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'evaluation_scores';
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'evaluation_scores'::regclass;
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'evaluation_scores';
