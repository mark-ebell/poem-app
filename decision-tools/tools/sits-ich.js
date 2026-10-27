// SITS symptomatic intracerebral hemorrhage risk score with IV alteplase (Mazya 2012; EE+ 467).
const PATIENTS = ['1.8', '6.5', '14.4', '18.4', '19.7', '16.8', '11.4', '7.6', '2.3', '1.0'];
const NINDS = ['1.4', '1.9', '3.2', '5.4', '6.8', '8.9', '11.0', '13.2', '18.5', '25.8'];
const ECASS = ['1.4', '1.4', '1.8', '3.6', '4.4', '6.3', '7.5', '9.2', '15.3', '23.4'];
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'sits-ich',
  eeId: 467,
  title: 'Intracerebral hemorrhage with IV alteplase (SITS)',
  subtitle: 'Symptomatic intracerebral hemorrhage after thrombolysis for stroke',
  question: 'For a patient with ischemic stroke treated with IV alteplase, what is the risk of symptomatic intracerebral hemorrhage?',
  inputs: [
    { id: 'antithrombotic', type: 'choice', label: 'Antithrombotic use', ee: 'ANTITHROMBOTIC', options: [{ label: 'None', points: 0 }, { label: 'Aspirin alone', points: 2 }, { label: 'Aspirin plus clopidogrel', points: 3 }] },
    { id: 'nihss', type: 'choice', label: 'NIHSS score', ee: 'NIHSS', options: [{ label: 'Under 7', points: 0 }, { label: '7 to 12', points: 1 }, { label: '13 or more', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'glucose', type: 'check', label: 'Blood glucose 180 mg/dL (10 mmol/L) or more', points: 2, ee: 'GLUCOSE' },
    { id: 'age', type: 'check', label: 'Age 72 or older', points: 1, ee: 'AGE' },
    { id: 'sbp', type: 'check', label: 'Systolic BP over 145 mm Hg', points: 1, ee: 'BP' },
    { id: 'weight', type: 'check', label: 'Weight 95 kg (209 lb) or more', points: 1, ee: 'WEIGHT' },
    { id: 'onset', type: 'check', label: 'Onset to treatment 180 minutes or more', points: 1, ee: 'ONSET' },
    { id: 'htn', type: 'check', label: 'History of hypertension', points: 1, ee: 'HYPERTENSION' }
  ],
  compute(a) {
    const s = pointsOf(tool, a), k = Math.min(s, 9);
    return { score: { value: s, max: 12, label: 'SITS ICH score' }, headline: `Risk of symptomatic ICH: ${NINDS[k]}% (NINDS definition), ${ECASS[k]}% (ECASS definition)`,
      lines: [`${PATIENTS[k]}% of patients in the study had ${s >= 9 ? '9 or more points' : `a score of ${s}`}.`] };
  }
};
