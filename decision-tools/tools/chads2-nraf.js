// CHADS2 with annual stroke rates from the National Registry of Atrial Fibrillation (Gage 2001; EE+ 34,
// titled "SPAF" on EE+ although it scores CHADS2).
const { pointsOf } = require('../lib');
const RATES = [['1.9', '1.2 to 3.0', 120], ['2.8', '2.0 to 3.8', 463], ['4.0', '3.1 to 5.1', 523], ['5.9', '4.6 to 7.3', 337], ['8.5', '6.3 to 11.1', 220], ['12.5', '8.2 to 17.5', 65], ['18.2', '10.5 to 27.4', 5]];

const tool = module.exports = {
  id: 'chads2-nraf',
  eeId: 34,
  title: 'CHADS2 stroke risk in atrial fibrillation (NRAF cohort)',
  subtitle: 'Annual stroke risk without anticoagulation',
  question: 'For a patient with nonvalvular atrial fibrillation not taking warfarin, what is the yearly risk of stroke?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'chf', type: 'check', label: 'Recent heart failure', points: 1, ee: 'RECENT' },
    { id: 'htn', type: 'check', label: 'History of hypertension', points: 1, ee: 'HISTORY' },
    { id: 'age', type: 'check', label: 'Age 75 or older', points: 1, ee: 'AGE' },
    { id: 'dm', type: 'check', label: 'Diabetes', points: 1, ee: 'DIABETES' },
    { id: 'stroke', type: 'check', label: 'Previous stroke or TIA', points: 2, ee: 'STROKE' }
  ],
  points: { label: 'CHADS2 score', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a), [rate, ci, n] = RATES[s];
    return { headline: `${rate} strokes per 100 patient-years (95% CI ${ci})`, lines: [`${n} of 1733 patients had this score.`] };
  }
};
