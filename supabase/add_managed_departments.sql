-- MG評価者の管轄店舗カラムを追加
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS managed_departments TEXT[] DEFAULT '{}';

-- コメント追加
COMMENT ON COLUMN public.users.managed_departments IS 'MG評価者が管轄する店舗の配列';
