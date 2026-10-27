// Persistent symptoms 6 months after nonspecific neck pain in primary care (EE+ 446). Score as in EE+,
// which cuts the age and health-status terms to whole numbers.
module.exports = {
  id: 'neck-pain-prognosis',
  eeId: 446,
  title: 'Neck pain prognosis at 6 months',
  subtitle: 'Persistent symptoms after nonspecific neck pain',
  question: 'For a primary care patient with nonspecific neck pain, what is the risk of persistent symptoms at 6 months?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, default: 50, ee: 'AGE' },
    { id: 'health', type: 'number', label: 'Own health status today', unit: '0 = worst imaginable, 100 = best', min: 0, max: 100, step: 1, default: 100, ee: 'HEALTH_STATUS' },
    { id: 'pain', type: 'choice', label: 'Pain intensity (0 = no pain, 10 = worst imaginable)', ee: 'INTENSITY', options: Array.from({ length: 11 }, (_, k) => ({ label: String(k) })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'lbp', type: 'check', label: 'Accompanying low back pain', ee: 'LBP' },
    { id: 'trauma', type: 'check', label: 'Traumatic cause of neck complaints', ee: 'TRAUMA' },
    { id: 'headache', type: 'check', label: 'Accompanying headache', ee: 'HEADACHE' },
    { id: 'radiation', type: 'check', label: 'Pain radiating to the elbow or shoulder', ee: 'RADIATION' },
    { id: 'previous', type: 'check', label: 'Previous neck complaints', ee: 'PREVIOUS' },
    { id: 'paid', type: 'check', label: 'Paid employment', ee: 'PAID' }
  ],
  compute(a) {
    let s = Math.trunc(a.age / 10 * 7) + Math.trunc(a.health / 25 * -3) + 21 * a.lbp + 6 * a.trauma + 5 * a.headache;
    s += a.headache ? -4 * a.radiation + 4 * a.previous - 11 * a.paid + 2 * a.pain : -14 * a.radiation + 13 * a.previous + 9 * a.paid - a.pain;
    return s < 34 ? { score: { value: s, label: 'Score' }, level: 1, headline: 'Low risk: 46 of 161 (29%) had persistent symptoms at 6 months' }
      : s < 55 ? { score: { value: s, label: 'Score' }, level: 2, headline: 'Moderate risk: 44 of 98 (45%) had persistent symptoms at 6 months' }
      : { score: { value: s, label: 'Score' }, level: 3, headline: 'High risk: 34 of 56 (61%) had persistent symptoms at 6 months' };
  }
};
