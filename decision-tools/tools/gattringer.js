// Early mortality in acute ischemic stroke (Gattringer 2019; EE+ 577).
const { pointsOf } = require('../lib');
const RISK = { 2: '34 of 15,839 (0.21%)', 3: '65 of 12,412 (0.52%)', 4: '113 of 8270 (1.4%)', 5: '281 of 7065 (4.0%)', 6: '413 of 5338 (7.7%)', 7: '351 of 3188 (11.0%)', 8: '228 of 1203 (19.0%)' };

const tool = module.exports = {
  id: 'gattringer',
  eeId: 577,
  title: 'Early mortality in ischemic stroke (Gattringer)',
  subtitle: 'Death within 7 days of acute ischemic stroke',
  question: 'For a patient with acute ischemic stroke, what is the risk of death within 7 days?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: [{ label: 'Under 60', points: 0 }, { label: '60 to 69', points: 1 }, { label: '70 or older', points: 2 }] },
    { id: 'nihss', type: 'choice', label: 'NIH Stroke Scale score', ee: 'ddl2', options: [{ label: 'Under 5', points: 0 }, { label: '5 to 11', points: 2 }, { label: '12 to 23', points: 4 }, { label: 'Over 23', points: 5 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'rankin', type: 'check', label: 'Any disability before the stroke (modified Rankin Scale above 0)', points: 1, ee: 'cb1' },
    { id: 'dm', type: 'check', label: 'Diabetes', points: 1, ee: 'cb2' },
    { id: 'heart', type: 'check', label: 'Heart disease (coronary disease, heart failure, cardiomyopathy or valve disease)', points: 1, ee: 'cb3' },
    { id: 'posterior', type: 'check', label: 'Posterior circulation stroke syndrome', points: 1, ee: 'cb4' },
    { id: 'nonlacunar', type: 'check', label: 'Non-lacunar stroke', points: 1, ee: 'cb5' }
  ],
  points: { label: 'Score', max: 12 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `7-day mortality: ${s <= 1 ? '25 of 24,086 (0.10%)' : s >= 9 ? '57 of 252 (22.6%)' : RISK[s]}` };
  }
};
