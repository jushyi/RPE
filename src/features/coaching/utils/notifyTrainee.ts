/**
 * Fire-and-forget notification helper for notifying trainees.
 * Failures are logged but never thrown -- notification errors must not block primary actions.
 */
import { supabase } from '@/lib/supabase/client';

/**
 * Notify a trainee when their coach updates their plan.
 * Includes optional coach note text in the notification body.
 */
export async function notifyTraineePlanUpdate(
  traineeId: string,
  coachName: string,
  planName: string,
  note?: string,
  planId?: string
): Promise<void> {
  try {
    if (!supabase) return;

    const body = note
      ? `${coachName} updated ${planName}: "${note}"`
      : `${coachName} updated ${planName}`;

    await supabase.functions.invoke('send-push', {
      body: {
        recipient_ids: [traineeId],
        title: 'Plan Updated',
        body,
        data: { type: 'plan_update', plan_id: planId },
      },
    });
  } catch (err) {
    console.warn('Failed to notify trainee (plan update):', err);
  }
}
