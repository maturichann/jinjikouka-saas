-- evaluation_itemsテーブルにhide_criteria_from_selfカラムを追加
-- 本人評価時に評価基準を非表示にするかどうかのフラグ

ALTER TABLE evaluation_items
ADD COLUMN hide_criteria_from_self BOOLEAN DEFAULT false;

-- コメントを追加
COMMENT ON COLUMN evaluation_items.hide_criteria_from_self IS '本人評価時に評価基準（grade_criteria）を非表示にするか';
