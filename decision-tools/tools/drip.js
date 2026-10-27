// Drug Resistance in Pneumonia (DRIP) score (Webb 2016; EE+ 548).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'drip',
  eeId: 548,
  title: 'Drug Resistance in Pneumonia (DRIP) score',
  subtitle: 'Drug-resistant pathogens in community-acquired pneumonia',
  question: 'For a patient with community-acquired pneumonia, how likely is a drug-resistant pathogen?',
  inputs: [
    { type: 'heading', label: 'Major risk factors (2 points each)' },
    ...[['abx', 'Antibiotics within the previous 60 days', 'cb1'], ['ltc', 'Long-term care resident', 'cb2'], ['tube', 'Tube feeding', 'cb3'], ['prior', 'Infection with a drug-resistant pathogen in the past year', 'cb4']]
      .map(([id, label, ee]) => ({ id, type: 'check', label, points: 2, ee })),
    { type: 'heading', label: 'Minor risk factors (1 point each)' },
    ...[['hosp', 'Hospitalization within the previous 60 days', 'cb5'], ['lung', 'Chronic lung disease', 'cb6'], ['function', 'Poor functional status', 'cb7'], ['ppi', 'Gastric acid suppression', 'cb8'],
      ['wound', 'Receiving wound care', 'cb9'], ['mrsa', 'MRSA colonization in the past year', 'cb10']].map(([id, label, ee]) => ({ id, type: 'check', label, points: 1, ee }))
  ],
  points: { label: 'DRIP score', max: 14 },
  compute(a) {
    return pointsOf(tool, a) >= 4
      ? { level: 3, headline: 'High risk (4 or more points) for a drug-resistant pathogen', lines: ['In the prospective validation, 73% of the high-risk group had a drug-resistant pathogen, compared with 8% of the low-risk group (33% overall).'] }
      : { level: 1, headline: 'Low risk (under 4 points) for a drug-resistant pathogen', lines: ['In the prospective validation, 8% of the low-risk group had a drug-resistant pathogen, compared with 73% of the high-risk group (33% overall).'] };
  }
};
