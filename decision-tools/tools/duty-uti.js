// DUTY: urinary tract infection in children under 5 (Hay 2016; EE+ 554). Wording as in EE+.
module.exports = {
  id: 'duty-uti',
  eeId: 554,
  title: 'UTI in children under 5 (DUTY)',
  subtitle: 'Whether to collect urine, and whether to treat for UTI',
  question: 'For a child under 5 with an acute illness and a symptom suggesting UTI, should urine be collected, and how likely is UTI after a dipstick?',
  inputs: [
    { type: 'heading', label: 'Step 1: clinical findings (check all that apply)' },
    { id: 'pain', type: 'check', label: 'Pain or crying when passing urine', ee: 'cb1' },
    { id: 'smell', type: 'check', label: 'Smelly urine', ee: 'cb2' },
    { id: 'prior', type: 'check', label: 'Previous UTI', ee: 'cb3' },
    { id: 'noCough', type: 'check', label: 'No severe cough', ee: 'cb4' },
    { id: 'severe', type: 'check', label: 'Severe illness (6 or more on a 0 to 10 clinician scale)', ee: 'cb5' },
    { type: 'heading', label: 'Step 2: dipstick (check all that apply)' },
    { id: 'leuk', type: 'check', label: 'Leukocytes positive', ee: 'cb11' },
    { id: 'nitrite', type: 'check', label: 'Nitrites positive', ee: 'cb12' },
    { id: 'blood', type: 'check', label: 'Blood positive', ee: 'cb13' }
  ],
  compute(a) {
    const s1 = 2 * a.pain + 2 * a.smell + a.prior + 2 * a.noCough + 2 * a.severe;
    const s2 = s1 + 2 * a.leuk + 3 * a.nitrite + a.blood;
    const step1 = s1 <= 2 ? 'very low risk (0.45%) for UTI; urine sample not recommended' : s1 <= 4 ? 'low risk (3.6%) for UTI; order a urine sample only if clinically indicated' : 'moderate risk (18%) for UTI; urine sample recommended';
    const step2 = s2 <= 5 ? [1, 'low risk (0.5%) for UTI'] : s2 <= 8 ? [2, 'moderate risk (7.5%) for UTI'] : [4, 'high risk (52%) for UTI'];
    return { level: step2[0], headline: `With the dipstick: ${s2} points, ${step2[1]}`, lines: [`Step 1 (before urine): ${s1} points, ${step1}.`] };
  }
};
