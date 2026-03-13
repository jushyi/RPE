/**
 * Tests for the typing indicator debounce logic.
 * Tests the pure `createTypingDebounce` function extracted from useTypingIndicator.
 *
 * Behavior verified:
 * - Calling trigger() invokes onStart immediately
 * - After 2s of no calls, onStop is invoked (debounce expires)
 * - Rapid calls reset the 2s timer (only one onStop after final call + 2s)
 * - cancel() clears the pending timer so onStop is never called
 */

import { createTypingDebounce } from '@/features/social/utils/chatUtils';

describe('createTypingDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls onStart immediately when trigger is called', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { trigger } = createTypingDebounce(onStart, onStop, 2000);

    trigger();

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('calls onStop after 2s of inactivity', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { trigger } = createTypingDebounce(onStart, onStop, 2000);

    trigger();
    jest.advanceTimersByTime(2000);

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onStop before 2s have elapsed', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { trigger } = createTypingDebounce(onStart, onStop, 2000);

    trigger();
    jest.advanceTimersByTime(1999);

    expect(onStop).not.toHaveBeenCalled();
  });

  it('resets the 2s timer on rapid calls (debounce behavior)', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { trigger } = createTypingDebounce(onStart, onStop, 2000);

    // Call at 0ms, 500ms, 1000ms — each resets the timer
    trigger();
    jest.advanceTimersByTime(500);
    trigger();
    jest.advanceTimersByTime(500);
    trigger(); // last call at t=1000ms

    // At t=2999ms (1999ms after last call), timer should NOT have fired
    jest.advanceTimersByTime(1999);
    expect(onStop).not.toHaveBeenCalled();

    // At t=3000ms (2000ms after last call), onStop should fire
    jest.advanceTimersByTime(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('calls onStart each time trigger is invoked', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { trigger } = createTypingDebounce(onStart, onStop, 2000);

    trigger();
    trigger();
    trigger();

    expect(onStart).toHaveBeenCalledTimes(3);
  });

  it('only fires onStop once for rapid calls (not per call)', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { trigger } = createTypingDebounce(onStart, onStop, 2000);

    trigger();
    trigger();
    trigger();
    jest.advanceTimersByTime(2000);

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('supports multiple start/stop cycles', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { trigger } = createTypingDebounce(onStart, onStop, 2000);

    // First cycle
    trigger();
    jest.advanceTimersByTime(2000);
    expect(onStop).toHaveBeenCalledTimes(1);

    // Second cycle
    trigger();
    jest.advanceTimersByTime(2000);
    expect(onStop).toHaveBeenCalledTimes(2);
  });

  it('cancel() clears the pending timer so onStop is never called', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { trigger, cancel } = createTypingDebounce(onStart, onStop, 2000);

    trigger();
    cancel();
    jest.advanceTimersByTime(2000);

    expect(onStop).not.toHaveBeenCalled();
  });
});
