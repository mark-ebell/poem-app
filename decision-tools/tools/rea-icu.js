// REA-ICU: early ICU admission in community-acquired pneumonia (Renaud 2009, validated by Labarère 2012; EE+ 492).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'rea-icu',
  eeId: 492,
  title: 'Pneumonia prognosis and early ICU admission (REA-ICU)',
  subtitle: 'Early ICU admission and 30-day mortality in community-acquired pneumonia',
  question: 'For a patient admitted with community-acquired pneumonia, what are the risks of early ICU admission and death?',
  inputs: [
    { id: 'male', type: 'check', label: 'Male sex', points: 1, ee: 'MALE' },
    { id: 'under80', type: 'check', label: 'Age under 80 years', points: 1, ee: 'AGE' },
    { id: 'comorbid', type: 'check', label: 'One or more comorbid conditions', points: 1, ee: 'COMORBID', note: 'Neoplastic disease, cirrhosis or chronic liver disease, renal dysfunction, cerebrovascular disease (stroke, bleed or TIA), CHF, CAD, COPD and diabetes mellitus.' },
    { id: 'rr', type: 'check', label: 'Respiratory rate 30/min or more', points: 1, ee: 'RESP' },
    { id: 'pulse', type: 'check', label: 'Pulse 125 beats/min or more', points: 1, ee: 'PULSE' },
    { id: 'wbc', type: 'check', label: 'WBC under 3000 or 20,000 or more', points: 1, ee: 'WBC' },
    { id: 'bun', type: 'check', label: 'BUN 11 mmol/L or more', points: 2, ee: 'BUN' },
    { id: 'ox', type: 'check', label: 'Pulse oximetry under 90% or PaO₂ under 60 mm Hg', points: 2, ee: 'PULSEOX' },
    { id: 'ph', type: 'check', label: 'Arterial pH under 7.35', points: 2, ee: 'PH' },
    { id: 'multilobar', type: 'check', label: 'Multilobar infiltrates or pleural effusion', points: 2, ee: 'MULTILOBAR' },
    { id: 'na', type: 'check', label: 'Sodium under 130 mEq/L', points: 3, ee: 'SODIUM' }
  ],
  points: { label: 'REA-ICU score', max: 17 },
  compute(a) {
    const s = pointsOf(tool, a);
    const [cls, icu, m, level] = s < 4 ? ['I', '1.8', '1.5', 1] : s < 7 ? ['II', '7.0', '5.2', 2] : s < 9 ? ['III', '15.2', '10.5', 3] : ['IV', '27.6', '20.7', 4];
    return { level, headline: `Risk class ${cls}: ${icu}% early ICU admission, ${m}% 30-day mortality` };
  }
};
