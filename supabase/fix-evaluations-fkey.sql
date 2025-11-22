-- evaluationsテーブルの外部キー制約を修正
-- 古い外部キー制約（profilesテーブルを参照）を削除して、
-- 正しい外部キー制約（usersテーブルを参照）を追加

-- 1. 古い外部キー制約を削除
ALTER TABLE public.evaluations
DROP CONSTRAINT IF EXISTS evaluations_evaluatee_id_fkey;

ALTER TABLE public.evaluations
DROP CONSTRAINT IF EXISTS evaluations_evaluator_id_fkey;

-- 2. 正しい外部キー制約を追加（usersテーブルを参照）
ALTER TABLE public.evaluations
ADD CONSTRAINT evaluations_evaluatee_id_fkey
FOREIGN KEY (evaluatee_id) REFERENCES public.users(id);

ALTER TABLE public.evaluations
ADD CONSTRAINT evaluations_evaluator_id_fkey
FOREIGN KEY (evaluator_id) REFERENCES public.users(id);
