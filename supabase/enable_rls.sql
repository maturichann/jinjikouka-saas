-- ============================================
-- RLS有効化 + 全許可ポリシー
-- anon keyでの全操作を許可しつつ、RLSを有効にする
-- 将来の権限制御の土台になる
-- ============================================

-- 1. 全テーブルでRLSを有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_periods ENABLE ROW LEVEL SECURITY;

-- ranking_memosテーブルが存在する場合のみ
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ranking_memos') THEN
    EXECUTE 'ALTER TABLE public.ranking_memos ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2. anon/authenticated に全操作を許可するポリシー
-- （現状の動作を維持しつつRLSを有効にする）

-- users
DROP POLICY IF EXISTS "Allow all for anon" ON public.users;
CREATE POLICY "Allow all for anon" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- evaluations
DROP POLICY IF EXISTS "Allow all for anon" ON public.evaluations;
CREATE POLICY "Allow all for anon" ON public.evaluations
  FOR ALL USING (true) WITH CHECK (true);

-- evaluation_scores
DROP POLICY IF EXISTS "Allow all for anon" ON public.evaluation_scores;
CREATE POLICY "Allow all for anon" ON public.evaluation_scores
  FOR ALL USING (true) WITH CHECK (true);

-- evaluation_items
DROP POLICY IF EXISTS "Allow all for anon" ON public.evaluation_items;
CREATE POLICY "Allow all for anon" ON public.evaluation_items
  FOR ALL USING (true) WITH CHECK (true);

-- evaluation_templates
DROP POLICY IF EXISTS "Allow all for anon" ON public.evaluation_templates;
CREATE POLICY "Allow all for anon" ON public.evaluation_templates
  FOR ALL USING (true) WITH CHECK (true);

-- evaluation_periods
DROP POLICY IF EXISTS "Allow all for anon" ON public.evaluation_periods;
CREATE POLICY "Allow all for anon" ON public.evaluation_periods
  FOR ALL USING (true) WITH CHECK (true);

-- ranking_memos（存在する場合）
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ranking_memos') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow all for anon" ON public.ranking_memos';
    EXECUTE 'CREATE POLICY "Allow all for anon" ON public.ranking_memos FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;
