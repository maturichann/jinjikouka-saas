-- evaluation_periods テーブルに template_id カラムを追加
ALTER TABLE public.evaluation_periods
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.evaluation_templates(id);
