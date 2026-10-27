// Hospital-onset C. difficile infection (Chandra 2012; EE+ 500). Wording as in EE+.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'cdi-chandra',
  eeId: 500,
  title: 'Hospital-onset C. difficile risk (Chandra)',
  subtitle: 'C. difficile infection in adults on a medical service',
  question: 'For an adult inpatient on a medical service, is the risk of C. difficile infection increased?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'stool', type: 'check', label: 'New unformed stool', points: 5, ee: 'STOOL' },
    { id: 'los', type: 'check', label: 'Hospital stay over 7 days', points: 4, ee: 'LOS' },
    { id: 'age', type: 'check', label: 'Age over 65', points: 3, ee: 'AGE' },
    { id: 'ltc', type: 'check', label: 'Long-term care resident', points: 2, ee: 'LTC' },
    { id: 'abx', type: 'check', label: 'High-risk antibiotic use', points: 1, ee: 'ANTIBIOTIC' },
    { id: 'albumin', type: 'check', label: 'Albumin below 30 g/L', points: 1, ee: 'HYPO' }
  ],
  points: { label: 'Score', max: 16 },
  compute(a) {
    return pointsOf(tool, a) < 9 ? { level: 1, headline: 'Not at increased risk for C. difficile infection' }
      : { level: 3, headline: 'At increased risk for C. difficile infection; consider treating (e.g. metronidazole)' };
  }
};
