// Pulmonary nodules in colorectal cancer: progression-free survival (EE+ 523).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'crc-lung-nodule',
  eeId: 523,
  title: 'Pulmonary nodule prognosis in colorectal cancer',
  subtitle: 'Progression-free survival with lung nodules found at colorectal cancer surgery',
  question: 'For an adult having curative surgery for colorectal cancer who has a nodule on chest CT, what is the 2-year progression-free survival?',
  inputs: [
    { id: 'nodal', type: 'choice', label: 'Nodal stage', ee: 'NODAL', options: [{ label: 'Stage 0', points: 0 }, { label: 'Stage 1 to 3', points: 1 }, { label: 'Above stage 3', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'metachronous', type: 'check', label: 'Metachronous lesions', points: 3, ee: 'METACHRONOUS' },
    { id: 'bilateral', type: 'check', label: 'Bilateral (rather than unilateral) nodules', points: 2, ee: 'BILATERAL' },
    { id: 'perineural', type: 'check', label: 'Perineural invasion', points: 2, ee: 'PERINEURAL' },
    { id: 'rectal', type: 'check', label: 'Tumor in the rectum (rather than the colon)', points: 2, ee: 'RECTAL' }
  ],
  points: { label: 'Score', max: 11 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 4 ? { level: 1, headline: 'Very low risk: 98% 2-year progression-free survival' } : s < 8 ? { level: 2, headline: 'Low risk: 68% 2-year progression-free survival' }
      : s < 11 ? { level: 3, headline: 'Intermediate risk: 38% 2-year progression-free survival' } : { level: 4, headline: 'High risk: 16% 2-year progression-free survival' };
  }
};
