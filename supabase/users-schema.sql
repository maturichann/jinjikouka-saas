-- ユーザーテーブル (シンプルな認証用)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'mg', 'manager', 'staff')),
  department TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Row Level Securityを一時的に無効化（開発用）
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 初期管理者アカウントの作成
INSERT INTO public.users (email, name, role, department, password_hash)
VALUES ('belsia.yokota@gmail.com', '管理者', 'admin', '本社', 'admin123')
ON CONFLICT (email) DO NOTHING;
