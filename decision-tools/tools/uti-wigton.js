// UTI diagnosis in women with urinary symptoms (Wigton 1985; EE+ 28).
const PROB = ['0', '25', '56', '76', '86', '86'];
const { count } = require('../lib');
module.exports = {
  id: 'uti-wigton',
  eeId: 28,
  title: 'UTI diagnosis (Wigton)',
  subtitle: 'Probability of UTI in women with urinary symptoms',
  question: 'For a woman with urinary symptoms, what is the probability of a urinary tract infection?',
  inputs: [
    { id: 'history', type: 'check', label: 'History of UTI', ee: 'IDC_CHECKBOX_1' },
    { id: 'back', type: 'check', label: 'Back pain', ee: 'IDC_CHECKBOX_2' },
    { id: 'wbc', type: 'check', label: 'More than 15 urinary WBC per high-power field', ee: 'IDC_CHECKBOX_3' },
    { id: 'rbc', type: 'check', label: 'More than 5 urinary RBC per high-power field', ee: 'IDC_CHECKBOX_4' },
    { id: 'bact', type: 'check', label: 'More than a few bacteria in the urine', ee: 'IDC_CHECKBOX_5' }
  ],
  compute(a) {
    const n = count(a, ['history', 'back', 'wbc', 'rbc', 'bact']);
    return { score: { value: n, max: 5, label: 'Findings' }, level: n <= 1 ? 1 : n === 2 ? 2 : 3, headline: `Probability of UTI ${PROB[n]}%` };
  }
};
