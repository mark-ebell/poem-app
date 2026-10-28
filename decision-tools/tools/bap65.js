// BAP-65 in COPD exacerbations (Shorr 2011; EE+ 505).
const { count } = require('../lib');
module.exports = {
  id: 'bap65',
  eeId: 505,
  title: 'COPD exacerbation prognosis (BAP-65 score)',
  subtitle: 'Mortality and mechanical ventilation in COPD exacerbations',
  question: 'For a patient admitted with an acute exacerbation of COPD, what are the risks of death and mechanical ventilation?',
  inputs: [
    { id: 'bun', type: 'check', label: 'BUN 25 mg/dL or more', ee: 'BUN' },
    { id: 'mental', type: 'check', label: 'Altered mental status', ee: 'MENTAL' },
    { id: 'pulse', type: 'check', label: 'Pulse 109 beats/min or more', ee: 'PULSE' },
    { id: 'age', type: 'check', label: 'Age over 65 years', ee: 'AGE' }
  ],
  compute(a) {
    const n = count(a, ['bun', 'mental', 'pulse']);
    const [cls, m, v, level] = n === 0 ? (a.age ? ['II', '1.4', '2.2', 1] : ['I', '0.5', '2.1', 1]) : [['III', '3.7', '8.4', 2], ['IV', '12.7', '30.1', 3], ['V', '26.2', '54.6', 4]][n - 1];
    return { level, headline: `Risk class ${cls} of V: mortality ${m}%, mechanical ventilation ${v}%` };
  }
};
