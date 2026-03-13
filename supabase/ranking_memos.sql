-- ランキングメモテーブル（管理者専用・評価期間ごとに1つ）
CREATE TABLE IF NOT EXISTS ranking_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE UNIQUE,
  memo TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
