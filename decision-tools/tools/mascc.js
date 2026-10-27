// MASCC risk index for febrile neutropenia (Klastersky 2000; EE+ 337). EE+ subtracted the points for
// favorable findings from 26, which reversed low and high risk; here the points are added, as published,
// and the published "severe symptoms or moribund" (0 points) choice is added.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'mascc',
  eeId: 337,
  title: 'Febrile neutropenia risk (MASCC)',
  subtitle: 'Complications in patients with cancer and febrile neutropenia',
  question: 'For a patient with cancer and febrile neutropenia, what is the risk of serious complications?',
  inputs: [
    { id: 'burden', type: 'choice', label: 'Burden of illness', ee: 'COMBO_Extent', eeIndex: [0, 1, 2, 2], options: [{ label: 'No symptoms', points: 5 }, { label: 'Mild symptoms', points: 5 }, { label: 'Moderate symptoms', points: 3 }, { label: 'Severe symptoms or moribund', points: 0 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'bp', type: 'check', label: 'No hypotension (systolic BP 90 mm Hg or more)', points: 5, ee: 'CHK_Hypotension' },
    { id: 'copd', type: 'check', label: 'No COPD', points: 4, ee: 'CHK_COPD' },
    { id: 'solid', type: 'check', label: 'Solid tumor, or hematologic cancer with no previous fungal infection', points: 4, ee: 'CHK_Tumor' },
    { id: 'hydrated', type: 'check', label: 'No dehydration needing IV fluids', points: 3, ee: 'CHK_Dehydration' },
    { id: 'outpatient', type: 'check', label: 'Outpatient at onset of fever', points: 3, ee: 'CHK_Outpatient' },
    { id: 'age', type: 'check', label: 'Age under 60', points: 2, ee: 'CHK_Age' }
  ],
  points: { label: 'MASCC score', max: 26 },
  compute(a) {
    return pointsOf(tool, a) >= 21 ? { level: 1, headline: 'Low risk (21 or more): 9% had serious complications or died' } : { level: 4, headline: 'High risk (under 21): 36% had serious complications or died' };
  },
  evidence: { reference: 'Klastersky J, Paesmans M, Rubenstein EB, et al. The Multinational Association for Supportive Care in Cancer risk index: a multinational scoring system for identifying low-risk febrile neutropenic cancer patients. J Clin Oncol. 2000;18(16):3038-3051.', pmid: '10944139' }
};
