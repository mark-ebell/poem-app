// HAS-BLED score: major bleeding on anticoagulation for atrial fibrillation (Pisters 2010; EE+ 455).
const { pointsOf } = require('../lib');
const RISK = [['1.1%', '1.2%'], ['1.0%', '2.8%'], ['1.9%', '3.6%'], ['3.7%', '6.0%'], ['8.9%', '9.3%']];

const tool = module.exports = {
  id: 'has-bled',
  eeId: 455,
  title: 'HAS-BLED score',
  subtitle: '1-year risk of major bleeding in atrial fibrillation',
  question: 'For a patient with atrial fibrillation on anticoagulation, what is the 1-year risk of major bleeding?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    ...[['htn', 'Hypertension (uncontrolled, systolic BP over 160 mm Hg)', 'HYPERTENSION'], ['renal', 'Abnormal renal function (dialysis, transplant, or creatinine 200 µmol/L or 2.26 mg/dL or more)', 'RENAL'],
      ['liver', 'Abnormal liver function (cirrhosis, or bilirubin over 2 × normal with AST, ALT or alkaline phosphatase over 3 × normal)', 'LIVER'], ['stroke', 'Previous stroke', 'STROKE'],
      ['bleeding', 'Bleeding history or predisposition (such as anemia)', 'BLEEDING'], ['inr', 'Labile INR (time in therapeutic range under 60%)', 'INR'], ['age', 'Age over 65', 'AGE'],
      ['drugs', 'Antiplatelet drug or NSAID use', 'NSAID'], ['alcohol', 'Alcohol excess', 'ALCOHOL']].map(([id, label, ee]) => ({ id, type: 'check', label, points: 1, ee }))
  ],
  points: { label: 'HAS-BLED score', max: 9 },
  compute(a) {
    const s = pointsOf(tool, a), [eh, sp] = RISK[Math.min(4, s)];
    return { level: s <= 1 ? 1 : s === 2 ? 2 : 4, headline: `1-year major bleeding: ${eh} (Euro Heart Survey), ${sp} (SPORTIF)`, lines: s >= 4 ? ['Scores of 4 or more are grouped.'] : [] };
  }
};
