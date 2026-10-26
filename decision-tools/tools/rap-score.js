// RAP score: readmission after pancreatectomy (Valero 2015; EE+ 521).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'rap-score',
  eeId: 521,
  title: 'Readmission after pancreatectomy (RAP score)',
  subtitle: 'Hospital readmission after pancreatectomy',
  question: 'For a patient after pancreatectomy, what is the risk of readmission?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dementia', type: 'check', label: 'History of dementia', points: 9, ee: 'DEMENTIA' },
    { id: 'sepsis', type: 'check', label: 'Sepsis', points: 5, ee: 'SEPSIS' },
    { id: 'ssi', type: 'check', label: 'Surgical site infection', points: 5, ee: 'INFECTION' },
    { id: 'mi', type: 'check', label: 'History of myocardial infarction', points: 3, ee: 'MI' },
    { id: 'bleed', type: 'check', label: 'Postoperative hemorrhage', points: 3, ee: 'HEMORRHAGE' },
    { id: 'dge', type: 'check', label: 'Delayed gastric emptying', points: 3, ee: 'EMPTYING' },
    { id: 'asa', type: 'check', label: 'ASA class III or higher', points: 2, ee: 'ASA' },
    { id: 'los', type: 'check', label: 'Length of stay under 2 days', points: 2, ee: 'LOS' }
  ],
  points: { label: 'RAP score', max: 32 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 4 ? { level: 1, headline: 'Low risk of readmission (12%)' } : s < 8 ? { level: 2, headline: 'Moderate risk of readmission (18%)' } : { level: 4, headline: 'High risk of readmission (45%)' };
  }
};
