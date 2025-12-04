-- evaluationsテーブルのstage CHECK制約を更新して'final'ステージを追加

-- 既存の制約を削除
ALTER TABLE public.evaluations
DROP CONSTRAINT IF EXISTS evaluations_stage_check;

-- 新しい制約を追加（'final'を含む）
ALTER TABLE public.evaluations
ADD CONSTRAINT evaluations_stage_check
CHECK (stage IN ('self', 'manager', 'mg', 'final'));
