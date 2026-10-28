// McIsaac (modified Centor) sore throat score (McIsaac 2000; EE+ 1). EE+ subtracted a point for ages
// 15 to 44 as well as 45 and over; in the published score ages 15 to 44 score 0.
const PROB = { '-1': [1, 11, 0], 0: [1, 11, 0], 1: [10, 57, 2], 2: [17, 71, 3], 3: [35, 87, 8], 4: [51, 93, 14], 5: [51, 93, 14] };
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'mcisaac-strep',
  eeId: 1,
  title: 'Strep diagnosis in sore throat (McIsaac)',
  subtitle: 'Modified Centor score for group A strep pharyngitis',
  question: 'For a child or adult with sore throat, what is the probability of strep, before and after a rapid strep test?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '3 to 14 years', points: 1 }, { label: '15 to 44 years', points: 0 }, { label: '45 years or older', points: -1 }] },
    { id: 'fever', type: 'check', label: 'History of fever or measured temperature over 38 °C (100.4 °F)', points: 1, ee: 'FEVER' },
    { id: 'tonsils', type: 'check', label: 'Tonsillar swelling or exudates', points: 1, ee: 'SWELLING' },
    { id: 'nodes', type: 'check', label: 'Tender anterior cervical nodes', points: 1, ee: 'TENDER_NODES' },
    { id: 'noCough', type: 'check', label: 'Absence of cough', points: 1, ee: 'NO_COUGH' }
  ],
  points: { label: 'McIsaac score', max: 5 },
  compute(a) {
    const s = pointsOf(tool, a), [p, pos, neg] = PROB[s];
    return { level: p < 10 ? 1 : p < 30 ? 2 : 3, headline: `Probability of strep ${p}%`, lines: [{ label: 'If rapid strep test positive', value: `${pos}%` }, { label: 'If rapid strep test negative', value: `${neg}%` }] };
  }
};
