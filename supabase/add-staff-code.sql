-- Step 1: staff_code カラムを追加
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS staff_code VARCHAR(10) UNIQUE;

-- Step 2: email カラムをオプショナルに変更（NULL許可）
ALTER TABLE public.users
ALTER COLUMN email DROP NOT NULL;

-- Step 3: 既存の管理者アカウントにスタッフコードを設定
UPDATE public.users
SET staff_code = '006'
WHERE email = 'belsia.yokota@gmail.com';
