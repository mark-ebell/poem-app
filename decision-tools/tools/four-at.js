// 4AT: delirium and cognitive impairment in older inpatients (Shenkin 2019; EE+ 614).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'four-at',
  eeId: 614,
  title: 'Delirium assessment (4AT)',
  subtitle: 'Delirium and cognitive impairment in older hospital and ED patients',
  question: 'For a hospital or ED patient 70 or older, is delirium or cognitive impairment likely?',
  inputs: [
    { id: 'alertness', type: 'choice', label: '1. Alertness', ee: 'ddl1', options: [{ label: 'Normal (fully alert, not agitated, throughout the assessment)', points: 0 }, { label: 'Mild sleepiness for under 10 seconds after waking, then normal', points: 0 }, { label: 'Clearly abnormal', points: 4 }] },
    { id: 'amt4', type: 'choice', label: '2. AMT4: age, date of birth, place (hospital or building), current year', ee: 'ddl2', options: [{ label: 'No mistakes', points: 0 }, { label: '1 mistake', points: 1 }, { label: '2 or more mistakes or untestable', points: 2 }] },
    { id: 'attention', type: 'choice', label: '3. Attention: months of the year backwards from December', ee: 'ddl3', options: [{ label: '7 or more months correct', points: 0 }, { label: 'Starts but scores under 7 months, or refuses to start', points: 1 }, { label: 'Untestable (cannot start because unwell, drowsy or inattentive)', points: 2 }],
      note: 'One prompt ("what is the month before December?") is allowed.' },
    { type: 'heading', label: 'Check if present' },
    { id: 'acute', type: 'check', label: '4. Acute change or fluctuating course: significant change or fluctuation in alertness, cognition or other mental function (e.g. paranoia, hallucinations) over the last 2 weeks and still evident in the last 24 hours', points: 4, ee: 'cb1' }
  ],
  points: { label: '4AT score', max: 12 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s === 0 ? { level: 1, headline: 'Delirium or severe cognitive impairment unlikely', lines: ['Delirium is still possible if the information for item 4 is incomplete.'] }
      : s <= 3 ? { level: 2, headline: 'Possible cognitive impairment' } : { level: 4, headline: 'Possible delirium, with or without cognitive impairment' };
  }
};
