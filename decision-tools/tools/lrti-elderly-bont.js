// 30-day hospitalization or death in older adults with lower respiratory tract infection (Bont 2007; EE+ 590).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'lrti-elderly-bont',
  eeId: 590,
  title: 'Lower respiratory tract infection: prognosis in elderly adults',
  subtitle: 'Hospitalization or death within 30 days in primary care',
  question: 'For a patient 65 or older with a lower respiratory tract infection (pneumonia, acute bronchitis or COPD exacerbation), what is the 30-day risk of hospitalization or death?',
  inputs: [
    { id: 'dx', type: 'choice', label: 'Diagnosis', ee: 'ddl1', options: [{ label: 'Acute bronchitis', points: 0 }, { label: 'Exacerbation of COPD', points: 2 }, { label: 'Pneumonia', points: 4 }] },
    { id: 'age80', type: 'check', label: 'Age 80 years or older', points: 2, ee: 'cb1' },
    { id: 'chf', type: 'check', label: 'Congestive heart failure', points: 1, ee: 'cb2' },
    { id: 'dm', type: 'check', label: 'Diabetes mellitus', points: 2, ee: 'cb3' },
    { id: 'steroid', type: 'check', label: 'Using oral corticosteroids', points: 3, ee: 'cb4' },
    { id: 'abx', type: 'check', label: 'Used antibiotics in the previous month', points: 2, ee: 'cb5' },
    { id: 'hosp', type: 'choice', label: 'Hospitalizations in the previous year', ee: 'ddl2', options: [{ label: 'None', points: 0 }, { label: '1', points: 2 }, { label: '2 or more', points: 3 }] }
  ],
  points: { label: 'Points' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 2 ? { level: 1, headline: 'Low risk: 5.3% hospitalized or died within 30 days' } : s <= 6 ? { level: 2, headline: 'Moderate risk: 14.5% hospitalized or died within 30 days' } : { level: 3, headline: 'High risk: 22.0% hospitalized or died within 30 days' };
  }
};
