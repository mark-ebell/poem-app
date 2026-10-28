// Mycoplasma pneumonia in children (Fischer 2002; EE+ 181).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'mycoplasma-children',
  eeId: 181,
  title: 'Mycoplasma in children with pneumonia',
  subtitle: 'Probability of mycoplasma pneumonia in children',
  question: 'For a child aged 1 month to 16 years with community-acquired pneumonia, what is the probability of mycoplasma?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: ['Under 0.5', '0.5 to 2', 'Over 2 to 4', 'Over 4 to 7', 'Over 7 to 10', 'Over 10'].map((label, points) => ({ label: `${label} years`, points })) },
    { id: 'fever', type: 'choice', label: 'Duration of fever', ee: 'IDC_COMBOBOX_2', options: ['Under 1', '1 to 3', 'Over 3 to 5', 'Over 5 to 7', 'Over 7 to 14', 'Over 14'].map((label, points) => ({ label: `${label} days`, points })) }
  ],
  points: { label: 'Points', max: 10 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 3 ? { level: 1, headline: 'Low risk: 2% (95% CI 0.2% to 7.3%)' } : s <= 5 ? { level: 2, headline: 'Moderate risk: 6.8% (95% CI 2.5% to 14%)' }
      : s <= 7 ? { level: 3, headline: 'High risk: 28% (95% CI 16% to 43%)' } : { level: 4, headline: 'Very high risk: 65% (95% CI 38% to 86%)' };
  }
};
