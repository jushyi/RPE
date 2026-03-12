// TODO: uncomment when implemented
// import { useCoaching } from '@/features/coaching/hooks/useCoaching';

// Stub for coaching relationship CRUD
describe('useCoaching', () => {
  describe('generateCode', () => {
    it.todo('inserts invite code with 24h expiry');
    it.todo('retries on code collision');
  });

  describe('redeemCode', () => {
    it.todo('creates coaching relationship on valid code');
    it.todo('throws on expired code');
    it.todo('throws on already-redeemed code');
  });

  describe('disconnect', () => {
    it.todo('removes coaching relationship');
  });

  describe('fetchRelationships', () => {
    it.todo('separates trainees and coaches for current user');
  });
});
