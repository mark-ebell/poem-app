// UTI in febrile girls under 2 years (Gorelick 2000; EE+ 329).
const { count } = require('../lib');
module.exports = {
  id: 'uti-girls-gorelick',
  eeId: 329,
  title: 'UTI diagnosis in girls under 2 years',
  subtitle: 'Febrile girls under 2 at risk for urinary tract infection',
  question: 'For a girl under 2 years with fever, what is the probability of a UTI?',
  inputs: [
    { id: 'age', type: 'check', label: 'Age under 12 months', ee: 'CHK_Age' },
    { id: 'temp', type: 'check', label: 'Temperature over 39 °C (102.2 °F)', ee: 'CHK_Temp' },
    { id: 'white', type: 'check', label: 'White race', ee: 'CHK_White' },
    { id: 'fever', type: 'check', label: 'Fever for 2 days or more', ee: 'CHK_Fever' },
    { id: 'source', type: 'check', label: 'No other potential source of fever', ee: 'CHK_Source' }
  ],
  footnote: 'Overall risk of UTI 4%.',
  compute(a) {
    const n = count(a, ['age', 'temp', 'white', 'fever', 'source']);
    return { score: { value: n, max: 5, label: 'Findings' }, ...(n >= 2 ? { level: 3, headline: '6.4% with UTI' } : { level: 1, headline: '0.8% with UTI' }) };
  }
};
