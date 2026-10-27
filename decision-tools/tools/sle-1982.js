// 1982 American Rheumatism Association criteria for systemic lupus erythematosus (Tan 1982; EE+ 233).
// EE+ said 4 of 7 criteria were needed; the criteria are 4 of 11.
const check = (id, label, ee, note) => ({ id, type: 'check', label, ee, ...(note ? { note } : {}) });
const IDS = ['malar', 'discoid', 'photo', 'ulcers', 'arthritis', 'serositis', 'renal', 'neuro', 'blood', 'immune', 'ana'];

module.exports = {
  id: 'sle-1982',
  eeId: 233,
  title: 'SLE criteria (ACR 1982, revised 1997)',
  subtitle: 'ACR classification criteria for systemic lupus erythematosus',
  question: 'Does a patient meet the ACR criteria for systemic lupus erythematosus?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    check('malar', 'Malar rash', 'CHK_Malar', 'Red rash over the cheeks and the bridge of the nose.'),
    check('discoid', 'Discoid rash', 'CHK_Discoid', 'Red, scaly rash on the face, scalp, ears, arms or chest.'),
    check('photo', 'Photosensitivity', 'CHK_Photo'),
    check('ulcers', 'Oral ulcers', 'CHK_Ulcers', 'Small sores on the moist lining of the nose or mouth.'),
    check('arthritis', 'Arthritis', 'CHK_Arthritis', 'Pain in the joints of the hands, arms, shoulders, feet, legs, hips or jaw, which may move from joint to joint, with heat, redness and swelling.'),
    check('serositis', 'Serositis', 'CHK_Serositis', 'Pleurisy, or pericarditis documented by ECG or a rub heard by a physician.'),
    check('renal', 'Renal disorder', 'CHK_Renal', 'Persistent proteinuria over 0.5 g/day or over 3+, or cellular casts.'),
    check('neuro', 'Seizures or psychosis', 'CHK_Seizures'),
    check('blood', 'Low red cells, white cells or platelets', 'CHK_Decrease'),
    check('immune', 'Positive anti-DNA test', 'CHK_DNA', 'Antibody to native DNA, antibody to Sm nuclear antigen, or a false-positive serologic test for syphilis.'),
    check('ana', 'Positive ANA', 'CHK_ANA', 'An abnormal ANA titer in the absence of drugs associated with drug-induced lupus.')
  ],
  footnote: 'At least 4 of the 11 criteria are needed. The 2019 EULAR/ACR criteria (a separate score) are newer.',
  compute(a) {
    const n = IDS.reduce((t, k) => t + a[k], 0);
    return n >= 4 ? { score: { value: n, max: 11, label: 'Criteria' }, level: 3, headline: 'Meets criteria for SLE' }
      : { score: { value: n, max: 11, label: 'Criteria' }, level: 1, headline: 'Does not meet criteria for SLE' };
  }
};
