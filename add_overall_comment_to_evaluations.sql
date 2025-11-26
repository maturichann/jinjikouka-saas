-- evaluationsテーブルに総評メモカラムを追加

ALTER TABLE evaluations
ADD COLUMN overall_comment TEXT DEFAULT '';

-- 既存のfinal評価に対してもNULLではなく空文字列をデフォルトにする
UPDATE evaluations
SET overall_comment = ''
WHERE overall_comment IS NULL;
