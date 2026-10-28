// Sinusitis in adults with upper respiratory symptoms (Williams 1992; EE+ 110).
const OUT = ['9% (5% to 17%)', '21% (15% to 28%)', '40% (33% to 47%)', '63% (53% to 72%)', '81% (69% to 89%)', '92% (81% to 96%)'];
const { count } = require('../lib');
module.exports = {
  id: 'sinusitis-williams',
  eeId: 110,
  title: 'Sinusitis diagnosis (Williams)',
  subtitle: 'Probability of sinusitis in adults with upper respiratory symptoms',
  question: 'For an adult with upper respiratory symptoms, what is the probability of sinusitis?',
  inputs: [
    { id: 'tooth', type: 'check', label: 'Maxillary toothache', ee: 'IDC_CHECKBOX_1' },
    { id: 'purulent', type: 'check', label: 'Purulent secretion on examination', ee: 'IDC_CHECKBOX_2' },
    { id: 'decongest', type: 'check', label: 'Poor response to decongestants', ee: 'IDC_CHECKBOX_3' },
    { id: 'transillum', type: 'check', label: 'Abnormal transillumination', ee: 'IDC_CHECKBOX_4' },
    { id: 'colored', type: 'check', label: 'History of colored nasal discharge', ee: 'IDC_CHECKBOX_5' }
  ],
  compute(a) {
    const n = count(a, ['tooth', 'purulent', 'decongest', 'transillum', 'colored']);
    return { score: { value: n, max: 5, label: 'Findings' }, level: n <= 1 ? 1 : n === 2 ? 2 : 3, headline: `Probability of sinusitis ${OUT[n]}` };
  }
};
