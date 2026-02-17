-- 評価項目に有効グレード設定を追加
-- デフォルトは全5段階 ['A', 'B', 'C', 'D', 'E']
ALTER TABLE public.evaluation_items
ADD COLUMN IF NOT EXISTS enabled_grades TEXT[] DEFAULT ARRAY['A', 'B', 'C', 'D', 'E'];
