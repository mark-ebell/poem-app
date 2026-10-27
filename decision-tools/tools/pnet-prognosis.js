// Survival after resection of a pancreatic neuroendocrine tumor (EE+ 464).
module.exports = {
  id: 'pnet-prognosis',
  eeId: 464,
  title: 'Pancreatic neuroendocrine tumor prognosis',
  subtitle: '5-year survival after resection of a pancreatic neuroendocrine tumor',
  question: 'For a patient after resection of a pancreatic neuroendocrine tumor, what is the 5-year survival?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: 'Under 55', points: 0 }, { label: '55 to 75', points: 1 }, { label: 'Over 75', points: 2 }] },
    { id: 'grade', type: 'choice', label: 'Tumor grade', ee: 'GRADE', options: [{ label: 'Well or moderately differentiated', points: 0 }, { label: 'Poorly differentiated', points: 1 }] },
    { id: 'mets', type: 'choice', label: 'Distant metastases', ee: 'METS', options: [{ label: 'None', points: 0 }, { label: 'Liver', points: 1 }, { label: 'Other distant', points: 3 }] }
  ],
  points: { label: 'Score', max: 6 },
  compute(a) {
    const s = require('../lib').pointsOf(module.exports, a);
    return s < 1 ? { level: 1, headline: 'Low risk: 77% 5-year survival' } : s < 3 ? { level: 2, headline: 'Moderate risk: 51% 5-year survival' } : { level: 4, headline: 'High risk: 36% 5-year survival' };
  }
};
