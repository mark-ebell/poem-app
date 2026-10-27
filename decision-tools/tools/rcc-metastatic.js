// 1-year survival in metastatic renal cell carcinoma (Leibovich 2005; EE+ 325).
module.exports = {
  id: 'rcc-metastatic',
  eeId: 325,
  title: 'Metastatic renal cell carcinoma: 1-year survival',
  subtitle: 'Survival with metastatic renal cell carcinoma',
  question: 'For a patient with metastatic renal cell carcinoma, what is the 1-year survival?',
  inputs: [
    { id: 'years', type: 'choice', label: 'Years from nephrectomy to metastases', ee: 'COMBO_Years', options: [{ label: 'More than 2', points: 0 }, { label: 'Less than 2', points: 3 }, { label: '0 (metastases at nephrectomy)', points: 1 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'sx', type: 'check', label: 'Constitutional symptoms at presentation', points: 2, ee: 'CHK_Sx' },
    { id: 'bone', type: 'check', label: 'Bone metastases', points: 2, ee: 'CHK_Bone' },
    { id: 'liver', type: 'check', label: 'Liver metastases', points: 4, ee: 'CHK_Liver' },
    { id: 'multiple', type: 'check', label: 'Multiple metastases', points: 2, ee: 'CHK_Multiple' },
    { id: 'resection', type: 'check', label: 'Complete resection of metastatic RCC', points: -5, ee: 'CHK_RCC' },
    { id: 'thrombus', type: 'check', label: 'Tumor thrombus (level I to IV)', points: 3, ee: 'CHK_Tumor', note: 'Anything other than no thrombus or thrombus limited to the renal vein.' },
    { id: 'grade', type: 'check', label: 'Nuclear grade 4 in the primary tumor', points: 3, ee: 'CHK_Nuclear' },
    { id: 'necrosis', type: 'check', label: 'Coagulative tumor necrosis', points: 2, ee: 'CHK_Coag' }
  ],
  points: { label: 'Score' },
  compute(a) {
    const { pointsOf } = require('../lib'), s = pointsOf(module.exports, a);
    const p = s < 0 ? '85.1%' : s < 3 ? '72.1%' : s < 7 ? '58.8%' : s < 9 ? '39.0%' : '25.1%';
    return { headline: `1-year survival: ${p}` };
  }
};
