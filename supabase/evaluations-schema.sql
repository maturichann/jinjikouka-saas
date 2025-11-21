-- 評価テーブル（多段階評価: 本人 → 店長 → MG）
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id UUID REFERENCES public.evaluation_periods(id) ON DELETE CASCADE NOT NULL,
  evaluatee_id UUID REFERENCES public.users(id) NOT NULL,
  evaluator_id UUID REFERENCES public.users(id),
  stage TEXT NOT NULL CHECK (stage IN ('self', 'manager', 'mg')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'submitted')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(period_id, evaluatee_id, stage)
);

-- 評価スコアテーブル
CREATE TABLE IF NOT EXISTS public.evaluation_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.evaluation_items(id) ON DELETE CASCADE NOT NULL,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 1.0 AND score <= 5.0),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(evaluation_id, item_id)
);

-- Row Level Securityを一時的に無効化（開発用）
ALTER TABLE public.evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores DISABLE ROW LEVEL SECURITY;

-- 更新日時の自動更新トリガー
CREATE TRIGGER set_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_scores_updated_at
  BEFORE UPDATE ON public.evaluation_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- インデックス
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON public.evaluations(period_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluatee ON public.evaluations(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON public.evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_evaluation ON public.evaluation_scores(evaluation_id);
