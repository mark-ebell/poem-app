// Advanced chronic kidney disease after acute kidney injury (James 2017; EE+ 570).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'ckd-after-aki',
  eeId: 570,
  title: 'Risk of chronic kidney disease after acute kidney injury',
  subtitle: 'Advanced CKD after hospitalization with acute kidney injury',
  question: 'For a patient with a baseline eGFR over 45 mL/min hospitalized for acute kidney injury (creatinine up 0.3 mg/dL or more, or more than 50% above the prehospital baseline), what is the risk of advanced chronic kidney disease?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: ['Under 50', '50 to 59', '60 to 89', '90 or older'].map((label, points) => ({ label: `${label} years`, points })) },
    { id: 'female', type: 'check', label: 'Female sex', points: 3, ee: 'cb1' },
    { id: 'base', type: 'choice', label: 'Baseline (prehospital) serum creatinine', ee: 'ddl2', options: ['Under 0.6', '0.6 to < 0.8', '0.8 to < 1.0', '1.0 to < 1.2', '1.2 to < 1.3', '1.3 or more'].map((label, points) => ({ label: `${label} mg/dL`, points })) },
    { id: 'alb', type: 'choice', label: 'Albuminuria (albumin-creatinine ratio or dipstick)', ee: 'ddl3', options: [{ label: 'Normal', points: 0 }, { label: 'ACR 30 to 300 mg/g or dipstick trace or 1+', points: 1 }, { label: 'ACR over 300 mg/g or dipstick 2+ or more', points: 3 }, { label: 'Not measured', points: 1 }] },
    { id: 'stage', type: 'choice', label: 'Acute kidney injury stage', ee: 'ddl4', options: [{ label: '1: creatinine up 0.3 mg/dL or more, or 1.5 to 1.9 × baseline', points: 0 }, { label: '2: 2.0 to 2.9 × baseline', points: 1 }, { label: '3: 3.0 × baseline or more', points: 3 }] },
    { id: 'discharge', type: 'choice', label: 'Serum creatinine at hospital discharge', ee: 'ddl5', options: [['Under 1.0', 0], ['1.0 to < 1.3', 3], ['1.3 to < 1.6', 6], ['1.6 to < 1.9', 7], ['1.9 or more', 11]].map(([label, points]) => ({ label: `${label} mg/dL`, points })) }
  ],
  points: { label: 'Risk score' },
  compute(a) {
    const s = pointsOf(tool, a);
    const [level, r] = s <= 8 ? [1, '< 1%'] : s <= 14 ? [2, '1% to < 5%'] : s <= 17 ? [3, '5% to < 10%'] : s <= 19 ? [3, '10% to < 20%'] : [4, '> 20%'];
    return { level, headline: `Predicted risk of advanced chronic kidney disease ${r}` };
  }
};
