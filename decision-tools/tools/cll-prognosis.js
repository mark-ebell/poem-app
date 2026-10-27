// Prognostic index for newly diagnosed chronic lymphocytic leukemia (EE+ 466).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'cll-prognosis',
  eeId: 466,
  title: 'Chronic lymphocytic leukemia prognosis',
  subtitle: '5-year survival in newly diagnosed CLL',
  question: 'For a patient with newly diagnosed chronic lymphocytic leukemia, what is the 5-year survival?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: 'Under 50', points: 1 }, { label: '50 to 65', points: 2 }, { label: 'Over 65', points: 3 }] },
    { id: 'b2m', type: 'choice', label: 'β2-microglobulin', ee: 'BETA', options: [{ label: 'Below the upper limit of normal', points: 0 }, { label: '1 to 2 times the upper limit of normal', points: 1 }, { label: 'More than 2 times the upper limit of normal', points: 2 }] },
    { id: 'alc', type: 'choice', label: 'Absolute lymphocyte count (× 10⁹/L)', ee: 'LYMPHS', options: [{ label: 'Under 20', points: 0 }, { label: '20 to 50', points: 1 }, { label: 'Over 50', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'MALE' },
    { id: 'rai', type: 'check', label: 'Rai stage III or IV', points: 1, ee: 'RAI' },
    { id: 'nodes', type: 'check', label: '3 or more lymph node groups', points: 1, ee: 'NODES' }
  ],
  points: { label: 'Score', max: 10 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 4 ? { level: 1, headline: 'Low risk (3 or less): 5-year survival 95% (Mayo) to 97% (MD Anderson)' }
      : s < 8 ? { level: 2, headline: 'Moderate risk (4 to 7): 5-year survival 80% (MD Anderson) to 85% (Mayo)' }
      : { level: 4, headline: 'High risk (over 7): 5-year survival 55% (MD Anderson) to 61% (Mayo)' };
  }
};
