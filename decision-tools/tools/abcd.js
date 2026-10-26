// ABCD score: 7-day stroke risk after TIA (Rothwell 2005; EE+ 335).
const { pointsOf } = require('../lib');
const RISK = { 4: '1% (1 of 90; 95% CI 0 to 3%)', 5: '12% (8 of 66; 95% CI 4 to 20%)', 6: '31% (11 of 35; 95% CI 16 to 47%)' };
const ZERO = ['0% (0 of 28)', '0% (0 of 28)', '0% (0 of 74)', '0% (0 of 82)'];

const tool = module.exports = {
  id: 'abcd',
  eeId: 335,
  title: 'ABCD score',
  subtitle: '7-day risk of stroke after a TIA',
  question: 'For a patient with a TIA, what is the risk of stroke within 7 days?',
  inputs: [
    { id: 'features', type: 'choice', label: 'Clinical features', ee: 'COMBO_Features', options: [
      { label: 'Other', points: 0 }, { label: 'Speech disturbance without weakness', points: 1 }, { label: 'Unilateral weakness', points: 2 }] },
    { id: 'duration', type: 'choice', label: 'Duration', ee: 'COMBO_Duration', options: [
      { label: 'Under 10 minutes', points: 0 }, { label: '10 to 59 minutes', points: 1 }, { label: '60 minutes or more', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 60 or older', points: 1, ee: 'CHK_Age' },
    { id: 'bp', type: 'check', label: 'Systolic BP above 140 or diastolic 90 mm Hg or more', points: 1, ee: 'CHK_BP' }
  ],
  points: { label: 'ABCD score', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `7-day stroke risk: ${s <= 3 ? ZERO[s] : RISK[s]}` };
  }
};
