// ABC score: mortality in upper and lower GI bleeding (Laursen 2021; EE+ 624).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'abc-gib',
  eeId: 624,
  title: 'ABC score (GI bleeding)',
  subtitle: 'Mortality in acute upper and lower GI bleeding',
  question: 'For an adult with acute upper or lower GI bleeding, what is the risk of death?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: [{ label: 'Under 60', points: 0 }, { label: '60 to 74', points: 1 }, { label: '75 or older', points: 2 }] },
    { id: 'creat', type: 'choice', label: 'Creatinine', ee: 'ddl2', options: [
      { label: 'Under 100 µmol/L (1.1 mg/dL)', points: 0 }, { label: '100 to 150 µmol/L (1.1 to 1.7 mg/dL)', points: 1 }, { label: 'Over 150 µmol/L (1.7 mg/dL)', points: 2 }] },
    { id: 'asa', type: 'choice', label: 'ASA class', ee: 'ddl3', options: [{ label: '1 or 2', points: 0 }, { label: '3', points: 1 }, { label: '4 or higher', points: 3 }],
      note: 'ASA 1 healthy; 2 mild or moderate, well-controlled systemic disease; 3 severe disease limiting activity but not incapacitating; 4 incapacitating disease that is a constant threat to life.' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'urea', type: 'check', label: 'Urea above 10 mmol/L (BUN above 28 mg/dL)', points: 1, ee: 'cb1' },
    { id: 'albumin', type: 'check', label: 'Albumin below 30 g/L (3.0 g/dL)', points: 2, ee: 'cb2' },
    { id: 'mental', type: 'check', label: 'Altered mental status', points: 2, ee: 'cb3' },
    { id: 'cirrhosis', type: 'check', label: 'Liver cirrhosis', points: 2, ee: 'cb4' },
    { id: 'cancer', type: 'check', label: 'Disseminated cancer', points: 4, ee: 'cb5' }
  ],
  points: { label: 'ABC score', max: 18 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 3 ? { level: 1, headline: 'Low risk', lines: ['Upper GI bleeding: 1.0% 30-day mortality. Lower GI bleeding: 0.6% in-hospital mortality.'] }
      : s <= 7 ? { level: 2, headline: 'Moderate risk', lines: ['Upper GI bleeding: 7.0% 30-day mortality. Lower GI bleeding: 6.3% in-hospital mortality.'] }
      : { level: 4, headline: 'High risk', lines: ['Upper GI bleeding: 25% 30-day mortality. Lower GI bleeding: 18% in-hospital mortality.'] };
  }
};
