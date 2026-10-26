// ATRIA stroke risk score in atrial fibrillation (van den Ham validation; EE+ 542).
module.exports = {
  id: 'atria-stroke',
  eeId: 542,
  title: 'ATRIA stroke risk score',
  subtitle: 'Stroke risk in atrial fibrillation',
  question: 'For a patient with atrial fibrillation, what is the risk of stroke?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: 'Under 65' }, { label: '65 to 74' }, { label: '75 to 84' }, { label: '85 or older' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'stroke', type: 'check', label: 'History of previous stroke', ee: 'History' },
    { id: 'female', type: 'check', label: 'Female sex', points: 1, ee: 'FemaleSex' },
    { id: 'dm', type: 'check', label: 'Diabetes mellitus', points: 1, ee: 'DiabetesMelitus' },
    { id: 'chf', type: 'check', label: 'Congestive heart failure', points: 1, ee: 'CongestiveHeartFailure' },
    { id: 'htn', type: 'check', label: 'Hypertension', points: 1, ee: 'Hypertension' },
    { id: 'proteinuria', type: 'check', label: 'Proteinuria (urine dipstick 1+ or more)', points: 1, ee: 'Proteinuria' },
    { id: 'egfr', type: 'check', label: 'eGFR below 45 or end-stage renal disease', points: 1, ee: 'eGFR' }
  ],
  footnote: 'Age points depend on prior stroke: without stroke 0, 3, 5 or 6; with stroke 8, 7, 7 or 9 (for the four age groups).',
  compute(a) {
    const s = (a.stroke ? [8, 7, 7, 9] : [0, 3, 5, 6])[a.age] + a.female + a.dm + a.chf + a.htn + a.proteinuria + a.egfr;
    const r = s <= 3 ? [1, 'Low risk', '0.7'] : s <= 6 ? [2, 'Moderate risk', '2.1'] : [4, 'High risk', '5.2'];
    return { score: { value: s, max: 15, label: 'ATRIA score' }, level: r[0], headline: r[1], lines: [`Risk of stroke: ${r[2]} per 100 person-years.`] };
  }
};
