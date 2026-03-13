// TODO: uncomment when implemented
// import { RPE_TABLE, getWeightForRpeAndReps } from '@/features/calculator/utils/rpeTable';
// import { calculateEpley1RM } from '@/features/history/utils/epley';

describe('RPE_TABLE', () => {
  it.todo('RPE 10 at 1 rep equals 100%'); // CALC-03
  it.todo('has entries for RPE 6 through 10 in 0.5 increments'); // CALC-03
  it.todo('each RPE row has 12 rep entries'); // CALC-03
  it.todo('percentages decrease as reps increase for same RPE'); // CALC-03
});

describe('getWeightForRpeAndReps', () => {
  it.todo('returns correct weight for known RPE/rep/1RM combination'); // CALC-03
  it.todo('returns 0 for reps outside 1-12 range'); // CALC-03
  it.todo('returns 0 for invalid RPE value'); // CALC-03
});

describe('1RM estimation consistency', () => {
  it.todo('Epley formula matches existing calculateEpley1RM for known inputs'); // CALC-04
  it.todo('1RM at 1 rep returns the weight itself'); // CALC-04
  it.todo('returns 0 for invalid inputs'); // CALC-04
});
