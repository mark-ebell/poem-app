// Canadian Syncope Arrhythmia Risk Score: 30-day arrhythmia or death (Thiruganasambandamoorthy 2017; EE+ 582).
const { pointsOf } = require('../lib');
const RISK = { '-2': ['Very low', 0.2], '-1': ['Very low', 0.5], 0: ['Very low', 0.9], 1: ['Low', 1.9], 2: ['Moderate', 3.8], 3: ['Moderate', 7.5],
  4: ['High', 14], 5: ['High', 25], 6: ['Very high', 41], 7: ['Very high', 59], 8: ['Very high', 75] };
const LEVEL = { 'Very low': 1, Low: 1, Moderate: 2, High: 3, 'Very high': 4 };

const tool = module.exports = {
  id: 'syncope-arrhythmia',
  eeId: 582,
  title: 'Canadian Syncope Arrhythmia Risk Score',
  subtitle: '30-day risk of arrhythmia or death after syncope',
  question: 'For an adult seen in the ED within 24 hours of syncope, what is the 30-day risk of arrhythmia or death?',
  inputs: [
    { type: 'text', text: 'Excludes patients unconscious for more than 5 minutes, or with seizure, trauma or altered mental status.' },
    { id: 'dx', type: 'choice', label: 'Final ED diagnosis', ee: ['cb7', 'cb8'], options: [
      { label: 'Neither vasovagal nor cardiac syncope', points: 0 }, { label: 'Vasovagal syncope', points: -1 }, { label: 'Cardiac syncope', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'vasovagal', type: 'check', label: 'Vasovagal predisposition (warm crowded place, prolonged standing, fear, emotion or pain)', points: -1, ee: 'cb1' },
    { id: 'heart', type: 'check', label: 'History of heart disease (coronary or valvular disease, cardiomyopathy, heart failure, or previous arrhythmia)', points: 1, ee: 'cb2' },
    { id: 'sbp', type: 'check', label: 'Any systolic BP below 90 or above 180 mm Hg in the ED', points: 1, ee: 'cb3' },
    { id: 'troponin', type: 'check', label: 'Elevated troponin', points: 1, ee: 'cb4' },
    { id: 'qrs', type: 'check', label: 'QRS duration over 130 ms', points: 2, ee: 'cb5' },
    { id: 'qtc', type: 'check', label: 'Corrected QT interval over 480 ms', points: 1, ee: 'cb6' }
  ],
  points: { label: 'Score', max: 8 },
  compute(a) {
    const [label, p] = RISK[pointsOf(tool, a)];
    return { level: LEVEL[label], headline: `${label} risk: ${p}% with arrhythmia or death within 30 days` };
  },
  evidence: { reference: 'Thiruganasambandamoorthy V, Stiell IG, Sivilotti MLA, et al. Predicting short-term risk of arrhythmia among patients with syncope: the Canadian Syncope Arrhythmia Risk Score. Acad Emerg Med. 2017;24(11):1315-1326.' }
};
