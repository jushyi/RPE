-- Fix: Coach cannot see plan names or custom exercise names in trainee workout history
--
-- Root cause: The workout_plans table only has a coach SELECT policy for plans
-- the coach created (auth.uid() = coach_id). When the trainee history query
-- embeds workout_plans(name), the LEFT JOIN returns null for any plan the coach
-- cannot see, causing all plan-based workouts to appear as "Freestyle."
--
-- Similarly, the exercises table has no coach-facing SELECT policy, so trainee
-- custom exercises show as "Unknown" in the coach's trainee history view.
--
-- Fix: Add is_coach_of-based SELECT policies for both tables.

-- 1. Coach can view workout plans belonging to their trainees
CREATE POLICY "Coaches can view trainee plans"
  ON public.workout_plans FOR SELECT
  USING (public.is_coach_of(user_id));

-- 2. Coach can view plan days belonging to their trainees' plans
--    (needed for plan_days(day_name) embedded join in trainee history)
CREATE POLICY "Coaches can view trainee plan days"
  ON public.plan_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id
      AND public.is_coach_of(wp.user_id)
    )
  );

-- 3. Coach can view exercises belonging to their trainees (custom exercises)
CREATE POLICY "Coaches can view trainee exercises"
  ON public.exercises FOR SELECT
  USING (public.is_coach_of(user_id));
