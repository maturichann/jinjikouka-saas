-- ============================================
-- evaluations.status に 'confirmed' を追加
-- 管理者が最終評価を確定 → スタッフ本人に閲覧権限付与
-- ============================================

-- 既存のCHECK制約を削除して再作成
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'evaluations'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.evaluations DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
END $$;

-- 新しいCHECK制約（confirmed追加）
ALTER TABLE public.evaluations
ADD CONSTRAINT evaluations_status_check
CHECK (status IN ('pending', 'in_progress', 'submitted', 'confirmed'));
