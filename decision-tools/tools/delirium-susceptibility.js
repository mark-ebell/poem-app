// Delirium susceptibility in older medical inpatients (EE+ 547).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'delirium-susceptibility',
  eeId: 547,
  title: 'Delirium susceptibility in medical inpatients',
  subtitle: 'Delirium during hospitalization in adults 65 and older',
  question: 'For an adult 65 or older admitted to a medical ward, what is the risk of delirium during the stay?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dementia', type: 'check', label: 'Known dementia, or Mini-Mental State Exam under 24', points: 2, ee: 'cb1' },
    { id: 'age', type: 'check', label: 'Age 80 or older', points: 2, ee: 'cb2' },
    { id: 'sirs', type: 'check', label: 'SIRS positive', points: 1, ee: 'cb3', note: '2 or more of: heart rate over 90, temperature under 36°C or over 38°C, respiratory rate over 20, white cell count under 4 or over 12 × 10⁹/L.' },
    { id: 'infection', type: 'check', label: 'Working diagnosis of infection', points: 1, ee: 'cb4' },
    { id: 'vision', type: 'check', label: 'Poor vision in the record or clinically evident', points: 1, ee: 'cb5' }
  ],
  points: { label: 'Score', max: 7 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 1 ? { level: 1, headline: 'Low risk: 4 of 30 (13%) had delirium during the stay' } : s <= 4 ? { level: 2, headline: 'Intermediate risk: 48 of 204 (24%) had delirium during the stay' }
      : { level: 4, headline: 'High risk: 43 of 58 (74%) had delirium during the stay' };
  }
};
