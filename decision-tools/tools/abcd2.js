// ABCD2 score: 7-day stroke risk after TIA (pooled validation: Giles 2010; EE+ 410).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'abcd2',
  eeId: 410,
  title: 'ABCD2 score',
  subtitle: '7-day risk of stroke after a TIA',
  question: 'For a patient with a TIA, what is the risk of stroke within 7 days?',
  inputs: [
    { id: 'features', type: 'choice', label: 'Clinical features', ee: 'CMB_Clinical', options: [
      { label: 'Neither', points: 0 }, { label: 'Speech impairment without weakness', points: 1 }, { label: 'Unilateral weakness', points: 2 }] },
    { id: 'duration', type: 'choice', label: 'Duration', ee: 'CMB_Duration', options: [
      { label: 'Under 10 minutes', points: 0 }, { label: '10 to 59 minutes', points: 1 }, { label: '60 minutes or more', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 60 or older', points: 1, ee: 'CHK_Age' },
    { id: 'bp', type: 'check', label: 'Systolic BP 140 or diastolic 90 mm Hg or more', points: 1, ee: 'CHK_BP' },
    { id: 'dm', type: 'check', label: 'Diabetes', points: 1, ee: 'CHK_DM' }
  ],
  points: { label: 'ABCD2 score', max: 7 },
  compute(a) {
    const s = pointsOf(tool, a);
    const [level, clinic, ed] = s < 4 ? [1, '1%', '4%'] : s < 5 ? [2, '4%', '8%'] : s < 6 ? [3, '7%', '12%'] : [4, '9%', '14%'];
    return { level, headline: `7-day stroke risk: ${clinic} in clinics, ${ed} in EDs` };
  }
};
