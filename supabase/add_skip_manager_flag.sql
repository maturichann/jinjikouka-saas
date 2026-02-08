-- 店長評価スキップフラグを追加
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skip_manager_evaluation BOOLEAN DEFAULT false;

-- コメント追加
COMMENT ON COLUMN public.users.skip_manager_evaluation IS '店長評価をスキップして本人評価→MG評価に直接進むかどうか';
