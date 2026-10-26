// H2FPEF score: heart failure with preserved ejection fraction (Reddy 2018; EE+ 592).
module.exports = {
  id: 'h2fpef',
  eeId: 592,
  title: 'H2FPEF score',
  subtitle: 'Diagnosis of heart failure with preserved ejection fraction',
  question: 'For a patient with unexplained dyspnea and suspected heart failure with preserved ejection fraction, how likely is HFpEF?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'obese', type: 'check', label: 'BMI above 30 kg/m²', points: 2, ee: 'cb1' },
    { id: 'htn', type: 'check', label: '2 or more antihypertensive medicines', points: 1, ee: 'cb2' },
    { id: 'af', type: 'check', label: 'Paroxysmal or persistent atrial fibrillation', points: 3, ee: 'cb3' },
    { id: 'pasp', type: 'check', label: 'Doppler echo pulmonary artery systolic pressure above 35 mm Hg', points: 1, ee: 'cb4' },
    { id: 'age', type: 'check', label: 'Age over 60', points: 1, ee: 'cb5' },
    { id: 'ee', type: 'check', label: "Doppler echo E/e' ratio above 9", points: 1, ee: 'cb6' }
  ],
  points: { label: 'H2FPEF score', max: 9 },
  compute(a) {
    const s = 2 * a.obese + a.htn + 3 * a.af + a.pasp + a.age + a.ee;
    if (s <= 1) return { level: 1, headline: 'Score 0 to 1: low likelihood of HFpEF (below 10%)', lines: ['Consider other diagnoses.'] };
    if (s <= 5) return { level: 2, headline: 'Score 2 to 5: moderate likelihood of HFpEF (about 50%)', lines: ['Consider diagnostic confirmation.'] };
    return { level: 4, headline: 'Score 6 or more: high likelihood of HFpEF (above 90%)', lines: ['Consider initiating treatment.'] };
  }
};
