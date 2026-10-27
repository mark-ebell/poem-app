// OESIL score: 12-month mortality after syncope (Colivicchi 2003; EE+ 437).
const MORT = ['0%', '0.6%', '14%', '29%', '53%'];

module.exports = {
  id: 'oesil',
  eeId: 437,
  title: 'Syncope prognosis (OESIL score)',
  subtitle: '12-month mortality after syncope',
  question: 'For a patient over 12 with syncope, what is the risk of death within 12 months?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 65', ee: 'AGE65' },
    { id: 'cvd', type: 'check', label: 'History of cardiovascular disease', ee: 'CVD', note: 'Ischemic, valvular or primary myocardial heart disease; heart failure; peripheral arterial disease; or previous stroke or TIA.' },
    { id: 'prodrome', type: 'check', label: 'Syncope without a prodrome', ee: 'SYNCOPE' },
    { id: 'ecg', type: 'check', label: 'Abnormal ECG', ee: 'ECG', note: 'AF, SVT, MAT, frequent PVCs or PACs, VT, paced rhythm, conduction block, ventricular hypertrophy, left axis deviation, old MI, or ST/T changes possibly from ischemia.' }
  ],
  compute(a) {
    const n = a.age + a.cvd + a.prodrome + a.ecg;
    return { score: { value: n, max: 4, label: 'OESIL score' }, level: [1, 1, 3, 4, 4][n], headline: `12-month all-cause mortality: ${MORT[n]}` };
  }
};
