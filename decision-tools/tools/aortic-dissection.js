// Acute thoracic aortic dissection (von Kodolitsch; EE+ 166).
const { pct, postTest } = require('../lib');
const LR = [0.1, 0.5, 5.3, 66];

module.exports = {
  id: 'aortic-dissection',
  eeId: 166,
  title: 'Acute aortic dissection (von Kodolitsch)',
  subtitle: 'Likelihood of acute thoracic aortic dissection',
  question: 'In a patient with chest or back pain and suspected aortic dissection, how likely is acute thoracic aortic dissection?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'pain', type: 'check', label: 'Aortic pain (severe, sudden-onset, tearing)', points: 1, ee: 'CHECK_1' },
    { id: 'differential', type: 'check', label: 'Blood pressure or pulse differential between the arms', points: 1, ee: 'CHECK_2' },
    { id: 'mediastinum', type: 'check', label: 'Wide mediastinum on chest x-ray', points: 1, ee: 'CHECK_3' },
    { id: 'pretest', type: 'number', label: 'Pretest probability of dissection', unit: '%', min: 0.1, max: 99.9, step: 0.1, default: 10, adjust: true,
      note: '10% is the overall probability in the study. Change it to match your patient or setting.' }
  ],
  points: { label: 'Features', max: 3 },
  compute(a) {
    const n = [a.pain, a.differential, a.mediastinum].filter(Boolean).length;
    return {
      level: n + 1,
      headline: `Probability of dissection: ${pct(postTest(a.pretest, LR[n]))}`,
      lines: [`Likelihood ratio ${LR[n]}, pretest probability ${a.pretest}%`],
      table: { head: ['Features', 'Likelihood ratio', 'Probability'], rows: LR.map((lr, k) => [String(k), String(lr), pct(postTest(a.pretest, lr))]), current: n }
    };
  }
};
