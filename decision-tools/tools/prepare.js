// PREPARE score: serious complications after pancreatic resection (Uzunoglu 2014; EE+ 516).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'prepare',
  eeId: 516,
  title: 'PREPARE score (pancreatic resection)',
  subtitle: 'Serious complications after pancreatic resection',
  question: 'For a patient about to have a pancreatic resection, what is the risk of a serious complication (Clavien-Dindo grade III or higher)?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'albumin', type: 'check', label: 'Serum albumin below 3.5 g/dL', points: 5, ee: 'SERUM' },
    { id: 'urgent', type: 'check', label: 'Non-elective surgery', points: 4, ee: 'SURGERY' },
    { id: 'head', type: 'check', label: 'Pancreaticoduodenectomy (including pylorus-preserving) or duodenum-preserving pancreatic head resection', points: 2, ee: 'PROCEEDURE' },
    { id: 'pathology', type: 'check', label: 'Pathology not of pancreatic origin', points: 2, ee: 'PATHOLOGY' },
    { id: 'hr', type: 'check', label: 'Heart rate below 50 or above 80/min', points: 2, ee: 'HEARTRATE' },
    { id: 'sbp', type: 'check', label: 'Systolic BP below 110 or above 130 mm Hg', points: 2, ee: 'SBP' },
    { id: 'hb', type: 'check', label: 'Hemoglobin below 11.5 or above 17 g/dL', points: 1, ee: 'HEMOGLOBIN' },
    { id: 'asa', type: 'check', label: 'ASA class III or higher', points: 1, ee: 'ASA',
      note: 'ASA III or higher: one or more moderate or severe diseases, functional limitation, or disease that is a constant threat to life.' }
  ],
  points: { label: 'PREPARE score', max: 19 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 6 ? { level: 1, headline: 'Low risk: 18% serious complications' }
      : s < 10 ? { level: 2, headline: 'Moderate risk: 40% serious complications' }
      : { level: 4, headline: 'High risk: 66% serious complications' };
  }
};
