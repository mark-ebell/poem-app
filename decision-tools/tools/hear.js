// HEAR score: low risk of ACS without troponin (Moumneh; EE+ 604).
const { pointsOf } = require('../lib');
const R = [['0/1490', '0.0%'], ['6/2616', '0.2%'], ['15/4311', '0.3%'], ['24/4580', '0.5%'], ['66/4120', '1.6%'], ['73/2886', '2.5%'], ['86/1588', '5.4%'], ['40/503', '8.0%'], ['15/65', '23.1%']];

const tool = module.exports = {
  id: 'hear',
  eeId: 604,
  title: 'HEAR score',
  subtitle: 'Low risk of acute coronary syndrome without troponin',
  question: 'For an adult with suspected acute coronary syndrome, what is the 30-day risk of death, acute MI or revascularization before troponin testing?',
  inputs: [
    { id: 'history', type: 'choice', label: 'History', ee: 'ddl1', options: [
      { label: 'Incompatible with ACS', points: 0 }, { label: 'Potentially compatible with ACS', points: 1 }, { label: 'Strongly suggestive of ACS', points: 2 }] },
    { id: 'ecg', type: 'choice', label: 'ECG', ee: 'ddl2', options: [
      { label: 'Normal', points: 0 }, { label: 'Nonspecific repolarization abnormalities', points: 1 }, { label: 'Significant ST deviation', points: 2 }] },
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl3', options: [
      { label: 'Under 45 years', points: 0 }, { label: '45 to 65 years', points: 1 }, { label: 'Over 65 years', points: 2 }] },
    { id: 'risk', type: 'choice', label: 'Risk factors', ee: 'ddl4',
      note: 'Risk factors: currently treated diabetes, current or recent (less than 1 month) smoker, diagnosed hypertension, diagnosed hyperlipidemia, family history of CAD, or obesity.',
      options: [{ label: 'None', points: 0 }, { label: '1 or 2 risk factors', points: 1 }, { label: '3 or more risk factors, or known CAD', points: 2 }] }
  ],
  points: { label: 'HEAR score', max: 8 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { level: s <= 1 ? 1 : s <= 3 ? 2 : s <= 5 ? 3 : 4, headline: `30-day risk: ${R[s][1]}`,
      lines: [`${R[s][0]} patients with this score had death, acute MI or revascularization within 30 days.`],
      table: { head: ['Score', 'Patients with an event', 'Risk'], rows: R.map((r, k) => [String(k), r[0], r[1]]), current: s } };
  }
};
