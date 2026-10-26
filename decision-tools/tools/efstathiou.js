// Efstathiou score: hemorrhagic vs ischemic stroke (Efstathiou 2002; EE+ 212).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'efstathiou',
  eeId: 212,
  title: 'Efstathiou score (hemorrhagic vs ischemic stroke)',
  subtitle: 'Intracranial hemorrhage in acute stroke, before imaging',
  question: 'For a patient with acute stroke, how likely is intracranial hemorrhage?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'deterioration', type: 'check', label: 'Neurologic deterioration within 3 hours of admission', points: 6, ee: 'IDC_CHECKBOX_1' },
    { id: 'vomiting', type: 'check', label: 'Vomiting', points: 4, ee: 'IDC_CHECKBOX_2' },
    { id: 'wbc', type: 'check', label: 'White cell count above 12,000/µL', points: 4, ee: 'IDC_CHECKBOX_3' },
    { id: 'loc', type: 'check', label: 'Decreased level of consciousness', points: 3, ee: 'IDC_CHECKBOX_4' }
  ],
  points: { label: 'Score', max: 17 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 3 ? { level: 1, headline: 'Low risk of hemorrhage: 1 of 126 (1%)' }
      : s <= 10 ? { level: 2, headline: 'Moderate risk of hemorrhage: 2 of 13 (15%)' }
      : { level: 4, headline: 'High risk of hemorrhage: 28 of 29 (97%)' };
  },
  evidence: { reference: 'Efstathiou SP, Tsioulos DI, Zacharos ID, et al. A new classification tool for clinical differentiation between haemorrhagic and ischaemic stroke. J Intern Med. 2002;252(2):121-129.' }
};
