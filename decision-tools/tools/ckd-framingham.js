// 10-year risk of chronic kidney disease (O'Seaghdha 2012, Framingham; EE+ 490).
const RISK = ['0', '0', '1', '1', '2', '3', '5', '9', '14', '20', '30', '41', '54', '66', '76', '84'];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'ckd-framingham',
  eeId: 490,
  title: 'Chronic kidney disease risk score (Framingham)',
  subtitle: '10-year risk of chronic kidney disease',
  question: 'For an adult without chronic kidney disease, what is the 10-year risk of developing it?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: ['30 to 34', '35 to 39', '40 to 44', '45 to 49', '50 to 59', '60 to 64', '65 to 69', '70 to 74', '75 to 79', '80 to 85'].map((label, points) => ({ label: `${label} years`, points })) },
    { id: 'dm', type: 'check', label: 'Diabetes', points: 1, ee: 'DIABETES' },
    { id: 'htn', type: 'check', label: 'Hypertension', points: 1, ee: 'HYPERTENSION' },
    { id: 'protein', type: 'check', label: 'Dipstick proteinuria, trace or above', points: 1, ee: 'PROTEINURIA' },
    { id: 'gfr', type: 'choice', label: 'Estimated GFR (mL/min/1.73 m²)', ee: 'GFR', default: 2, options: [{ label: '60 to 74', points: 3 }, { label: '75 to 89', points: 1 }, { label: '90 or more', points: 0 }] }
  ],
  points: { label: 'Points', max: 15 },
  compute(a) {
    const s = pointsOf(tool, a), r = Number(RISK[s]);
    return { level: r < 5 ? 1 : r < 20 ? 2 : r < 50 ? 3 : 4, headline: `10-year risk of chronic kidney disease ${RISK[s]}%` };
  }
};
