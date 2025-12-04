-- evaluation_periodsテーブルに期間全体の総評カラムを追加

ALTER TABLE public.evaluation_periods
ADD COLUMN IF NOT EXISTS period_summary TEXT DEFAULT '';

UPDATE public.evaluation_periods
SET period_summary = ''
WHERE period_summary IS NULL;
