CREATE OR REPLACE FUNCTION get_exercise_chart_data(
  p_user_id UUID,
  p_exercise_id UUID,
  p_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  session_date TIMESTAMPTZ,
  max_weight NUMERIC,
  estimated_1rm NUMERIC,
  total_volume NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.ended_at AS session_date,
    MAX(sl.weight) AS max_weight,
    MAX(sl.estimated_1rm) AS estimated_1rm,
    SUM(sl.weight * sl.reps) AS total_volume
  FROM set_logs sl
  JOIN session_exercises se ON se.id = sl.session_exercise_id
  JOIN workout_sessions ws ON ws.id = se.session_id
  WHERE ws.user_id = p_user_id
    AND se.exercise_id = p_exercise_id
    AND ws.ended_at IS NOT NULL
    AND (p_since IS NULL OR ws.ended_at >= p_since)
  GROUP BY ws.ended_at
  ORDER BY ws.ended_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
