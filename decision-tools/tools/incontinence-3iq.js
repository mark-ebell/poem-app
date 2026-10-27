// 3 Incontinence Questions: type of urinary incontinence in women (Brown 2006; EE+ 351).
const OUT = ['74% stress, 12% urge, 12% mixed, 1% other (138 women)', '13% stress, 75% urge, 11% mixed, 1% other (91 women)',
  '30% stress, 60% urge, 0% mixed, 10% other (10 women)', '24% stress, 45% urge, 24% mixed, 6% other (62 women)'];

module.exports = {
  id: 'incontinence-3iq',
  eeId: 351,
  title: 'Type of urinary incontinence (3IQ)',
  subtitle: 'Stress or urge incontinence in women',
  question: 'For a woman with urinary incontinence, is it more likely stress or urge incontinence?',
  inputs: [
    { id: 'when', type: 'choice', label: 'During the last 3 months, did you leak urine most often:', ee: 'IDC_RADIO_1', options: [
      { label: 'During physical activity, such as coughing, sneezing, lifting or exercise' }, { label: 'With an urge to empty the bladder, before reaching the toilet' },
      { label: 'Without physical activity and without an urge' }, { label: 'About equally with physical activity and with an urge' }] }
  ],
  compute(a) {
    return { headline: OUT[a.when] };
  }
};
