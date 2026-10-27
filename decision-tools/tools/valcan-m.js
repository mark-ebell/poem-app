// VALCAN-M: 90-day mortality after surgery for clinical stage I non-small cell lung cancer (EE+ 642).
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'valcan-m',
  eeId: 642,
  title: 'Surgery for stage I lung cancer: 90-day mortality (VALCAN-M)',
  subtitle: '90-day mortality after surgery for clinical stage I NSCLC',
  question: 'For a patient with clinical stage I non-small cell lung cancer having surgery, what is the risk of death within 90 days?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'cboAge', default: 1, options: opts([['Under 60', -4], ['60 to 69', 0], ['70 to 79', 3], ['80 or older', 5]]) },
    { id: 'bmi', type: 'choice', label: 'BMI', ee: 'cboBMI', default: 1, options: opts([['Under 18.5', 6], ['18.5 to 24.9', 0], ['25 to 29.9', -1], ['30 to 34.9', -1], ['35 or more', 0]]) },
    { id: 'fev1', type: 'choice', label: 'FEV1', ee: 'cboFEV1', default: 2, options: opts([['Under 60%', 2], ['60% to 79%', 1], ['80% or more', 0]]) },
    { id: 'extent', type: 'choice', label: 'Extent of resection', ee: 'cboExtent', default: 2, options: opts([['Wedge', -2], ['Segmentectomy', -2], ['Lobectomy', 0], ['Pneumonectomy', 8]]) },
    { id: 'histology', type: 'choice', label: 'Histology', ee: 'cboHisto', options: opts([['Adenocarcinoma', 0], ['Squamous cell carcinoma', 2], ['Other', 1]]) },
    { id: 'asa', type: 'choice', label: 'ASA class', ee: 'cboASA', options: opts([['1', 0], ['2', 2], ['3', 3], ['4', 4], ['5', 6]]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'minimal', type: 'check', label: 'Minimally invasive surgical approach', points: -3, ee: 'chkMinimal' },
    { id: 'delay', type: 'check', label: 'Treatment delayed 12 weeks or more from radiographic diagnosis', points: 3, ee: 'chkDelaed' },
    { id: 'hf', type: 'check', label: 'History of heart failure', points: 2, ee: 'chkHF' },
    { id: 'dependent', type: 'check', label: 'Partially or fully dependent', points: 6, ee: 'chkDependent' },
    { id: 'pvd', type: 'check', label: 'History of peripheral vascular disease', points: 2, ee: 'chkPVD' }
  ],
  points: { label: 'VALCAN-M score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= -1 ? { level: 1, headline: 'Very low risk: predicted 90-day mortality under 1%' } : s <= 6 ? { level: 1, headline: 'Low risk: predicted 90-day mortality 1% to 4%' }
      : s <= 11 ? { level: 3, headline: 'Moderate risk: predicted 90-day mortality 4% to 10%' } : { level: 4, headline: 'High risk: predicted 90-day mortality over 10%' };
  }
};
