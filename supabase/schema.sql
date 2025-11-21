-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  position TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Evaluation templates
CREATE TABLE public.evaluation_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Evaluation items
CREATE TABLE public.evaluation_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.evaluation_templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  weight INTEGER NOT NULL CHECK (weight > 0), -- 配点
  criteria TEXT, -- 採点基準（1.0〜5.0の各レベルの説明）
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Evaluation periods
CREATE TABLE public.evaluation_periods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  template_id UUID REFERENCES public.evaluation_templates(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Evaluations (多段階評価: 本人 -> 店長 -> MG)
CREATE TABLE public.evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  period_id UUID REFERENCES public.evaluation_periods(id) ON DELETE CASCADE NOT NULL,
  evaluatee_id UUID REFERENCES public.profiles(id) NOT NULL, -- 被評価者
  evaluator_id UUID REFERENCES public.profiles(id), -- 評価者
  stage TEXT NOT NULL CHECK (stage IN ('self', 'manager', 'mg')), -- 本人, 店長, MG
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'submitted')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(period_id, evaluatee_id, stage)
);

-- Evaluation scores
CREATE TABLE public.evaluation_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.evaluation_items(id) ON DELETE CASCADE NOT NULL,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 1.0 AND score <= 5.0), -- 5段階評価（小数点1位まで）
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(evaluation_id, item_id)
);

-- Permissions (評価閲覧権限フィルター)
CREATE TABLE public.evaluation_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('view', 'edit')) DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, evaluation_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Evaluation permissions policies
CREATE POLICY "Users can view evaluations they have permission for" ON public.evaluations
  FOR SELECT USING (
    auth.uid() = evaluatee_id OR
    auth.uid() = evaluator_id OR
    EXISTS (
      SELECT 1 FROM public.evaluation_permissions
      WHERE user_id = auth.uid() AND evaluation_id = evaluations.id
    )
  );

CREATE POLICY "Users can edit evaluations they are assigned to" ON public.evaluations
  FOR UPDATE USING (
    auth.uid() = evaluator_id OR
    (stage = 'self' AND auth.uid() = evaluatee_id) OR
    EXISTS (
      SELECT 1 FROM public.evaluation_permissions
      WHERE user_id = auth.uid() AND evaluation_id = evaluations.id AND permission_type = 'edit'
    )
  );

-- Indexes for performance
CREATE INDEX idx_profiles_manager ON public.profiles(manager_id);
CREATE INDEX idx_evaluations_period ON public.evaluations(period_id);
CREATE INDEX idx_evaluations_evaluatee ON public.evaluations(evaluatee_id);
CREATE INDEX idx_evaluations_evaluator ON public.evaluations(evaluator_id);
CREATE INDEX idx_evaluation_scores_evaluation ON public.evaluation_scores(evaluation_id);
CREATE INDEX idx_evaluation_permissions_user ON public.evaluation_permissions(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.evaluation_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.evaluation_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.evaluation_periods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.evaluation_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
