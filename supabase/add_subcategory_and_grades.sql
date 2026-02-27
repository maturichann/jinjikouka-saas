-- evaluation_items テーブルに subcategory カラムを追加
ALTER TABLE public.evaluation_items ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- evaluations テーブルに overall_grade と final_decision カラムを追加
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS overall_grade TEXT;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS final_decision TEXT;
