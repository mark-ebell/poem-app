// MICE rule: heart failure in primary care (Roalfe; EE+ 477).
module.exports = {
  id: 'mice-hf',
  eeId: 477,
  title: 'MICE rule for heart failure',
  subtitle: 'Suspected heart failure in primary care: echo or natriuretic peptide first',
  question: 'For a primary care patient with suspected heart failure, should the next step be echocardiography or a natriuretic peptide test?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'mi', type: 'check', label: 'History of MI', ee: 'MI' },
    { id: 'crackles', type: 'check', label: 'Basal crackles on auscultation', ee: 'BASAL' },
    { id: 'maleEdema', type: 'check', label: 'Male with ankle edema', ee: 'MALE' }
  ],
  compute(a) {
    return a.mi || a.crackles || a.maleEdema
      ? { level: 3, headline: 'Refer for echocardiography' }
      : { level: 1, headline: 'Order a B-type natriuretic peptide; refer for echo if abnormal' };
  }
};
