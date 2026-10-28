// PRODIGY score: opioid-induced respiratory depression in hospitalized adults (Khanna 2020; EE+ 621).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'prodigy',
  eeId: 621,
  title: 'Opioid-induced respiratory depression (PRODIGY)',
  subtitle: 'Respiratory depression in hospitalized adults on opioids',
  question: 'For a hospitalized adult receiving opioids, what is the risk of respiratory depression?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: [{ label: 'Under 60', points: 0 }, { label: '60 to 69', points: 8 }, { label: '70 to 79', points: 12 }, { label: '80 or older', points: 16 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 8, ee: 'cb1' },
    { id: 'naive', type: 'check', label: 'Opioid naive', points: 3, ee: 'cb2' },
    { id: 'sleep', type: 'check', label: 'Sleep disorder', points: 5, ee: 'cb3' },
    { id: 'chf', type: 'check', label: 'Chronic heart failure', points: 7, ee: 'cb4' }
  ],
  points: { label: 'PRODIGY score', max: 39 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 8 ? { level: 1, headline: 'Low risk: 24% had an episode of respiratory depression' } : s <= 14 ? { level: 2, headline: 'Moderate risk: 42% had an episode of respiratory depression' }
      : { level: 4, headline: 'High risk: 65% had an episode of respiratory depression' };
  }
};
