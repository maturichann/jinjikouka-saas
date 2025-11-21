-- 評価テンプレートテーブル
CREATE TABLE IF NOT EXISTS public.evaluation_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 評価項目テーブル
CREATE TABLE IF NOT EXISTS public.evaluation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.evaluation_templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  weight INTEGER NOT NULL CHECK (weight > 0),
  criteria TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Row Level Securityを一時的に無効化（開発用）
ALTER TABLE public.evaluation_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_items DISABLE ROW LEVEL SECURITY;

-- 更新日時の自動更新トリガー
CREATE TRIGGER set_templates_updated_at
  BEFORE UPDATE ON public.evaluation_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON public.evaluation_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- インデックス
CREATE INDEX IF NOT EXISTS idx_evaluation_items_template ON public.evaluation_items(template_id);
