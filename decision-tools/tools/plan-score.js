// PLAN score: death or severe dependence after acute ischemic stroke (O'Donnell 2012; EE+ 475).
const { pointsOf } = require('../lib');
const BANDS = [[6, 1], [9.5, 3], [12.5, 10], [15.5, 28], [19.5, 58], [Infinity, 76]];

const tool = module.exports = {
  id: 'plan-score',
  eeId: 475,
  title: 'PLAN score',
  subtitle: 'Death or severe dependence after acute ischemic stroke',
  question: 'For an adult with acute ischemic stroke, what is the risk of dying in hospital or being severely dependent at discharge?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', default: 4, options: ['18 to 29', '30 to 39', '40 to 49', '50 to 59', '60 to 69', '70 to 79', '80 to 89', '90 to 99', '100 to 109'].map((label, k) => ({ label, points: k + 2 })) },
    { type: 'heading', label: 'Before admission: check all that apply' },
    { id: 'dependent', type: 'check', label: 'Dependent on others for care', points: 1.5, ee: 'PREADMISSION' },
    { id: 'cancer', type: 'check', label: 'Cancer', points: 1.5, ee: 'CANCER' },
    { id: 'chf', type: 'check', label: 'Heart failure', points: 1, ee: 'CHF' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation', points: 1, ee: 'AFIB' },
    { type: 'heading', label: 'On admission: check all that apply' },
    { id: 'loc', type: 'check', label: 'Reduced level of consciousness', points: 5, ee: 'LOC' },
    { id: 'arm', type: 'check', label: 'Arm weakness (significant or total)', points: 2, ee: 'ARM' },
    { id: 'leg', type: 'check', label: 'Leg weakness (significant or total)', points: 2, ee: 'LEG' },
    { id: 'neglect', type: 'check', label: 'Neglect or aphasia', points: 1, ee: 'NEGLECT' }
  ],
  points: { label: 'PLAN score' },
  compute(a) {
    const p = BANDS.find(([max]) => pointsOf(tool, a) < max)[1];
    return { headline: `${p}% died in hospital or were severely dependent at discharge` };
  }
};
