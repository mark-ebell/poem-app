// Pedigree Assessment Tool for BRCA mutation risk (Hoskins 2006; EE+ 480).
const { pointsOf } = require('../lib');
const count = (max, per) => Array.from({ length: max + 1 }, (_, k) => ({ label: k === 0 ? 'None' : k === max ? `${k} or more` : String(k), points: k * per }));

const tool = module.exports = {
  id: 'pat-brca',
  eeId: 480,
  title: 'BRCA risk (Pedigree Assessment Tool)',
  subtitle: 'Screening for women who may benefit from BRCA genetic testing',
  question: 'For a woman with a family history of breast or ovarian cancer, is her risk of a BRCA mutation 10% or more?',
  inputs: [
    { type: 'heading', label: 'Score the maternal and paternal sides separately and use the higher score. Count relatives of 1st, 2nd or 3rd degree.' },
    { id: 'old', type: 'choice', label: 'Female breast cancer at 50 or older', ee: 'FEMALEOLD', options: count(7, 3) },
    { id: 'young', type: 'choice', label: 'Female breast cancer before 50', ee: 'FEMALEYOUNG', options: count(4, 4) },
    { id: 'ovarian', type: 'choice', label: 'Ovarian cancer at any age', ee: 'OVARIAN', options: count(4, 5) },
    { id: 'male', type: 'choice', label: 'Male breast cancer at any age', ee: 'MALE', options: count(4, 8) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'oldBilateral', type: 'check', label: 'Any bilateral cancer among the women with breast cancer at 50 or older', points: 3, ee: 'FOBILATERAL' },
    { id: 'youngBilateral', type: 'check', label: 'Any bilateral cancer among the women with breast cancer before 50', points: 4, ee: 'FYBILATERAL' },
    { id: 'maleBilateral', type: 'check', label: 'Any bilateral cancer among the men with breast cancer', points: 8, ee: 'MALEBILATERAL' },
    { id: 'jewish', type: 'check', label: 'Ashkenazi Jewish heritage', points: 4, ee: 'JEWISH' }
  ],
  points: { label: 'PAT score' },
  compute(a) {
    return pointsOf(tool, a) >= 8 ? { level: 3, headline: 'Over 10% risk of a BRCA mutation' } : { level: 1, headline: 'Under 10% risk of a BRCA mutation' };
  }
};
