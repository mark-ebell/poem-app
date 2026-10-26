// Canadian TIA Score: stroke within 7 days (Perry 2014; EE+ 532).
const { pointsOf } = require('../lib');
const RISK = ['0.01', '0.02', '0.03', '0.04', '0.07', '0.11', '0.2', '0.3', '0.5', '0.8', '1.2', '2.0', '3.2', '5.1', '8.1', '12.6', '19.0', '27.6']; // scores -3 to 14+

const tool = module.exports = {
  id: 'canadian-tia',
  eeId: 532,
  title: 'Canadian TIA Score',
  subtitle: 'Stroke within 7 days of a TIA',
  question: 'For an adult diagnosed with a TIA in the ED, what is the risk of stroke within 7 days?',
  inputs: [
    { type: 'heading', label: 'History: check all that apply' },
    { id: 'first', type: 'check', label: 'First TIA in lifetime', points: 2, ee: 'TIA' },
    { id: 'duration', type: 'check', label: 'Symptoms for 10 minutes or more', points: 2, ee: 'Symptoms' },
    { id: 'carotid', type: 'check', label: 'History of carotid stenosis', points: 2, ee: 'carotid' },
    { id: 'antiplatelet', type: 'check', label: 'Already taking antiplatelet therapy', points: 3, ee: 'antiplatelet' },
    { id: 'gait', type: 'check', label: 'Gait disturbance', points: 1, ee: 'gait' },
    { id: 'weakness', type: 'check', label: 'Unilateral weakness', points: 1, ee: 'unilateral' },
    { id: 'vertigo', type: 'check', label: 'Vertigo', points: -3, ee: 'vertigo' },
    { type: 'heading', label: 'Examination and tests: check all that apply' },
    { id: 'dbp', type: 'check', label: 'Diastolic BP at triage 110 mm Hg or more', points: 3, ee: 'triage' },
    { id: 'speech', type: 'check', label: 'Dysarthria or aphasia (history or examination)', points: 1, ee: 'aphasia' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation on ECG', points: 2, ee: 'Atrial' },
    { id: 'infarct', type: 'check', label: 'Infarction (new or old) on head CT', points: 1, ee: 'Infarction' },
    { id: 'platelets', type: 'check', label: 'Platelets 400 × 10⁹/L or more', points: 2, ee: 'Platelet' },
    { id: 'glucose', type: 'check', label: 'Glucose 15 mmol/L (270 mg/dL) or more', points: 3, ee: 'Glucose' }
  ],
  points: { label: 'Canadian TIA Score', max: 23 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `Risk of stroke within 7 days: ${RISK[Math.min(17, s + 3)]}%` };
  },
  evidence: { population: 'Developed in 3906 patients seen with a TIA in the previous 7 days. Mean age 68 years, 51% women.' }
};
