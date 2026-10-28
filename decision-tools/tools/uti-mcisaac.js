// UTI in adult women with suspected cystitis (McIsaac 2007; EE+ 398).
const { count } = require('../lib');
module.exports = {
  id: 'uti-mcisaac',
  eeId: 398,
  title: 'UTI diagnosis (McIsaac)',
  subtitle: 'Probability of UTI in adult women with suspected cystitis',
  question: 'For an adult woman with suspected UTI, what is the probability of infection?',
  inputs: [
    { id: 'oneDay', type: 'check', label: 'Symptoms present for only 1 day', ee: 'CHK_1day' },
    { id: 'burning', type: 'check', label: 'Burning or discomfort with urination', ee: 'CHK_Burning' },
    { id: 'leuk', type: 'check', label: 'Urine dipstick more than trace leukocytes', ee: 'CHK_Leukocytes' },
    { id: 'nitrite', type: 'check', label: 'Urine dipstick positive for nitrites (any)', ee: 'CHK_Nitrates' }
  ],
  compute(a) {
    const n = count(a, ['oneDay', 'burning', 'leuk', 'nitrite']);
    const score = { value: n, max: 4, label: 'Findings' };
    return n < 2 ? { score, level: 1, headline: 'Low risk: 34/92 (37%) with UTI; consider other diagnoses' }
      : n < 3 ? { score, level: 2, headline: 'Moderate risk: 81/119 (68%) with UTI' }
      : { score, level: 3, headline: 'High risk: 93/120 (77%) with UTI' };
  }
};
