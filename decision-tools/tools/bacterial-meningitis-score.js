// Bacterial Meningitis Score in children (Nigrovic 2002; EE+ 277).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'bacterial-meningitis-score',
  eeId: 277,
  title: 'Bacterial Meningitis Score (children)',
  subtitle: 'Bacterial vs aseptic meningitis in children',
  question: 'For a child over 1 month old with CSF pleocytosis, how likely is bacterial meningitis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'gram', type: 'check', label: 'Positive CSF Gram stain', points: 2, ee: 'IDC_CHECKBOX_1' },
    { id: 'protein', type: 'check', label: 'CSF protein 80 mg/dL or more', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'anc', type: 'check', label: 'Peripheral absolute neutrophil count 10,000/µL or more', points: 1, ee: 'IDC_CHECKBOX_3' },
    { id: 'seizure', type: 'check', label: 'Seizure at or before presentation', points: 1, ee: 'IDC_CHECKBOX_4' },
    { id: 'csfAnc', type: 'check', label: 'CSF absolute neutrophil count 1000/µL or more', points: 1, ee: 'IDC_CHECKBOX_5' }
  ],
  points: { label: 'Bacterial Meningitis Score', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s === 0 ? { level: 1, headline: 'Low risk: 0 of 144 (0%, 95% CI 0 to 3%) had bacterial meningitis' }
      : s === 1 ? { level: 2, headline: 'Moderate risk: 5 of 42 (12%) had bacterial meningitis' } : { level: 4, headline: 'High risk: 33 of 38 (87%) had bacterial meningitis' };
  }
};
