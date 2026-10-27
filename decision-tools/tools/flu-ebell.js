// Influenza in adults with acute respiratory infection (Ebell 2012; EE+ 474). Wording as in EE+.
const { pointsOf } = require('../lib');
const OUT = [
  [['Very low risk for flu (0.4%); neither test nor treat.', 1], ['Very low risk for flu (2.1%); neither test nor treat.', 1], ['Low risk for flu (6.5%); neither test nor treat.', 1]],
  [['Very low risk for flu (1.9%); neither test nor treat.', 1], ['Low risk for flu (8.4%); neither test nor treat.', 1], ['Intermediate risk for flu (23%); consider a point-of-care test (84% flu if positive, 8% if negative).', 2]],
  [['Low risk for flu (6.8%); neither test nor treat.', 1], ['Intermediate risk for flu (26%); consider a point-of-care test (84% flu if positive, 8% if negative).', 2], ['High risk for flu (54%); consider empiric symptomatic or drug therapy (drug therapy only if presenting within 36 hours).', 4]]
];

const tool = module.exports = {
  id: 'flu-ebell',
  eeId: 474,
  title: 'Influenza diagnosis in adults (Ebell)',
  subtitle: 'Influenza in adults with acute respiratory infection',
  question: 'For an adult with an acute respiratory infection, how likely is influenza?',
  inputs: [
    { id: 'prevalence', type: 'choice', label: 'Community prevalence of influenza', ee: 'PREVALENCE', default: 2, options: [{ label: 'Not flu season (about 2.5%)' }, { label: 'Shoulder of flu season (10%)' }, { label: 'Flu season (30%)' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'fever', type: 'check', label: 'Both fever and cough', points: 2, ee: 'FEVER' },
    { id: 'myalgia', type: 'check', label: 'Myalgias', points: 2, ee: 'MYALGIAS' },
    { id: 'onset', type: 'check', label: 'Onset within the past 48 hours', points: 1, ee: 'ONSET' },
    { id: 'chills', type: 'check', label: 'Chills or sweats', points: 1, ee: 'CHILLS' }
  ],
  points: { label: 'Score', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a), [text, level] = OUT[a.prevalence][s < 3 ? 0 : s < 4 ? 1 : 2];
    return { level, headline: text };
  }
};
