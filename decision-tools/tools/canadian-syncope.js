// Canadian Syncope Risk Score: serious outcomes within 30 days (validation: Thiruganasambandamoorthy 2020; EE+ 626).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'canadian-syncope',
  eeId: 626,
  title: 'Canadian Syncope Risk Score',
  subtitle: 'Serious outcomes within 30 days after syncope',
  question: 'For a patient 16 or older seen in the ED with syncope, what is the risk of death or a serious condition within 30 days?',
  inputs: [
    { id: 'dx', type: 'choice', label: 'ED diagnosis', ee: ['cb8', 'cb9'], options: [
      { label: 'Neither vasovagal nor cardiac syncope', points: 0 }, { label: 'Vasovagal syncope', points: -2 }, { label: 'Cardiac syncope', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'vasovagal', type: 'check', label: 'Predisposition to vasovagal symptoms (warm crowded place, prolonged standing, fear, emotion or pain)', points: -1, ee: 'cb1' },
    { id: 'heart', type: 'check', label: 'History of heart disease', points: 1, ee: 'cb2',
      note: 'Coronary or valvular heart disease, cardiomyopathy, heart failure, a non-sinus rhythm on the ECG at this visit, a documented ventricular or atrial arrhythmia, or an implanted device.' },
    { id: 'sbp', type: 'check', label: 'Any systolic BP below 90 or above 180 mm Hg at triage or in the ED', points: 2, ee: 'cb3' },
    { id: 'troponin', type: 'check', label: 'Elevated troponin (above the 99th percentile)', points: 2, ee: 'cb4' },
    { id: 'axis', type: 'check', label: 'Abnormal QRS axis (below -30° or above 100°)', points: 1, ee: 'cb5' },
    { id: 'qrs', type: 'check', label: 'QRS duration over 130 ms', points: 1, ee: 'cb6' },
    { id: 'qtc', type: 'check', label: 'Corrected QT interval over 480 ms', points: 2, ee: 'cb7' }
  ],
  points: { label: 'Score', max: 11 },
  compute(a) {
    const s = pointsOf(tool, a);
    if (s <= -2) return { level: 1, headline: 'Very low risk', lines: ['0 deaths and 3 serious conditions (0.2%) among 1631 patients.'] };
    if (s <= 0) return { level: 1, headline: 'Low risk', lines: ['0 deaths and 9 serious conditions (0.7%) among 1254 patients.'] };
    if (s <= 3) return { level: 2, headline: 'Medium risk', lines: ['1 death (0.1%) and 55 serious conditions (8%) among 687 patients.'] };
    if (s <= 5) return { level: 3, headline: 'High risk', lines: ['5 deaths (3%) and 32 serious conditions (19%) among 167 patients.'] };
    return { level: 4, headline: 'Very high risk', lines: ['7 deaths (9%) and 40 serious conditions (51%) among 78 patients.'] };
  }
};
