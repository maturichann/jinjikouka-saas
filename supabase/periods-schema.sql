-- 評価期間テーブル
CREATE TABLE IF NOT EXISTS public.evaluation_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Row Level Securityを一時的に無効化（開発用）
ALTER TABLE public.evaluation_periods DISABLE ROW LEVEL SECURITY;

-- 更新日時の自動更新トリガー
CREATE TRIGGER set_periods_updated_at
  BEFORE UPDATE ON public.evaluation_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
