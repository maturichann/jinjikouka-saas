-- 評価項目の配点（grade_scores）を更新
-- テンプレートID: 44206e04-ba5b-4002-b365-3910cf24fb08

-- 業績評価 (3項目) - order_index 1-3
UPDATE evaluation_items SET grade_scores = '{"A": 4, "B": 3.2, "C": 2.4, "D": 1.6, "E": 0.8}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 1;

UPDATE evaluation_items SET grade_scores = '{"A": 4, "B": 3.2, "C": 2.4, "D": 1.6, "E": 0.8}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 2;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.8, "C": 2.1, "D": 1.4, "E": 0.7}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 3;

-- 職務評価 (13項目) - order_index 4-16
UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 4;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 5;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 6;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 7;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 3, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 8;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 9;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 10;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 11;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 12;

-- 身だしなみ (AとBが空欄のため0に設定)
UPDATE evaluation_items SET grade_scores = '{"A": 0, "B": 0, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 13;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 14;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 15;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 16;

-- 行動評価 (20項目) - order_index 17-36
UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 17;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 18;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 19;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 20;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 21;

UPDATE evaluation_items SET grade_scores = '{"A": 3.5, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 22;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 23;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 24;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 25;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 26;

-- 勤怠の正確性 (Aが空欄のため0に設定)
UPDATE evaluation_items SET grade_scores = '{"A": 0, "B": 2.5, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 27;

UPDATE evaluation_items SET grade_scores = '{"A": 4, "B": 3.2, "C": 2.4, "D": 1.6, "E": 0.8}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 28;

UPDATE evaluation_items SET grade_scores = '{"A": 4, "B": 3.2, "C": 2.4, "D": 1.6, "E": 0.8}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 29;

UPDATE evaluation_items SET grade_scores = '{"A": 4, "B": 3.2, "C": 2.4, "D": 1.6, "E": 0.8}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 30;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 31;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 32;

UPDATE evaluation_items SET grade_scores = '{"A": 4, "B": 3.2, "C": 2.4, "D": 1.6, "E": 0.8}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 33;

UPDATE evaluation_items SET grade_scores = '{"A": 2.5, "B": 2, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 34;

-- 商材の適切な管理 (AとBが空欄のため0に設定)
UPDATE evaluation_items SET grade_scores = '{"A": 0, "B": 0, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 35;

-- 備品の大切な扱い (AとBが空欄のため0に設定)
UPDATE evaluation_items SET grade_scores = '{"A": 0, "B": 0, "C": 1.5, "D": 1, "E": 0.5}'
WHERE template_id = '44206e04-ba5b-4002-b365-3910cf24fb08' AND order_index = 36;
