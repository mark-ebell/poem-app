// Radiographic pneumonia in nursing home residents (Mehr 2001; EE+ 125).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'pneumonia-nursing-home-dx',
  eeId: 125,
  title: 'Diagnosis of pneumonia (nursing home)',
  subtitle: 'Radiographic pneumonia in nursing home residents',
  question: 'For a nursing home resident with signs or symptoms of lower respiratory tract infection, what is the probability of pneumonia?',
  inputs: [
    { id: 'rr', type: 'check', label: 'Respiratory rate 30/min or more', points: 1, ee: 'IDC_CHECKBOX_1' },
    { id: 'somnolence', type: 'check', label: 'Somnolence or decreased alertness', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'wheeze', type: 'check', label: 'Wheezes', points: -1, ee: 'IDC_CHECKBOX_3' },
    { id: 'confusion', type: 'check', label: 'Acute confusion', points: 1, ee: 'IDC_CHECKBOX_4' },
    { id: 'temp', type: 'check', label: 'Temperature over 38 °C (100.4 °F)', points: 1, ee: 'IDC_CHECKBOX_5' },
    { id: 'crackles', type: 'check', label: 'Crackles on auscultation', points: 1, ee: 'IDC_CHECKBOX_6' },
    { id: 'wbc', type: 'choice', label: 'WBC (cells/mm³)', ee: 'IDC_COMBOBOX_1', options: ['Under 10,000', '10,000 to 14,999', '15,000 or more'].map((label, points) => ({ label, points })) },
    { id: 'pulse', type: 'choice', label: 'Pulse (beats/min)', ee: 'IDC_COMBOBOX_2', options: ['Under 100', '100 to 129', '130 or more'].map((label, points) => ({ label, points })) }
  ],
  footnote: 'Overall risk of pneumonia 45%.',
  compute(a) {
    const s = pointsOf(tool, a) + 1;
    const p = s < 2 ? 24 : s < 3 ? 37 : s < 4 ? 44 : s < 5 ? 56 : 68;
    return { level: p < 30 ? 1 : p < 50 ? 2 : 3, headline: `Probability of pneumonia ${p}%` };
  },
  evidence: { reference: 'Mehr DR, Binder EF, Kruse RL, Zweig SC, Madsen RW, D\'Agostino RB. Clinical findings associated with radiographic pneumonia in nursing home residents. J Fam Pract. 2001;50(11):931-7.', pmid: '11711008' }
};
