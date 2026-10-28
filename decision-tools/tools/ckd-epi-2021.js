// CKD-EPI 2021 race-free eGFR equations (Inker 2021). Not an EE+ tool: added at Mark Ebell's request
// (2026-10-28) in place of the MDRD (EE+ 278, 357) and Mayo quadratic (EE+ 400) equations.
const STAGES = [[90, 'G1 (normal or high)'], [60, 'G2 (mildly decreased)'], [45, 'G3a (mildly to moderately decreased)'], [30, 'G3b (moderately to severely decreased)'], [15, 'G4 (severely decreased)'], [0, 'G5 (kidney failure)']];
const stage = g => STAGES.find(([min]) => g >= min)[1];
const r = g => Math.round(g);
module.exports = {
  id: 'ckd-epi-2021',
  title: 'GFR estimation (CKD-EPI 2021)',
  subtitle: 'Race-free eGFR from creatinine, with or without cystatin C',
  question: 'For an adult, what is the estimated GFR by the 2021 CKD-EPI equations?',
  categories: ['Renal disease'],
  inputs: [
    { id: 'units', type: 'choice', label: 'Creatinine units', options: [{ label: 'mg/dL' }, { label: 'µmol/L' }] },
    { id: 'creatMg', type: 'number', label: 'Serum creatinine', unit: 'mg/dL', min: 0.2, max: 20, step: 0.01, when: a => a.units === 0 },
    { id: 'creatUmol', type: 'number', label: 'Serum creatinine', unit: 'µmol/L', min: 18, max: 1800, when: a => a.units === 1 },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110 },
    { id: 'sex', type: 'choice', label: 'Sex', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'cys', type: 'number', label: 'Serum cystatin C (optional)', unit: 'mg/L', min: 0.2, max: 10, step: 0.01, optional: true }
  ],
  footnote: 'Creatinine equation: eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^age × 1.012 if female (κ 0.7 female, 0.9 male; α −0.241 female, −0.302 male). Creatinine-cystatin C equation: 135 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−0.544 × min(Scys/0.8, 1)^−0.323 × max(Scys/0.8, 1)^−0.778 × 0.9961^age × 0.963 if female (α −0.219 female, −0.144 male). Stages are the KDIGO GFR categories.',
  compute(a) {
    const female = a.sex === 1, k = female ? 0.7 : 0.9;
    const x = (a.units === 1 ? a.creatUmol / 88.4 : a.creatMg) / k;
    const cr = 142 * Math.pow(Math.min(x, 1), female ? -0.241 : -0.302) * Math.pow(Math.max(x, 1), -1.2) * Math.pow(0.9938, a.age) * (female ? 1.012 : 1);
    const lines = [{ label: 'Creatinine equation', value: `${r(cr)} mL/min/1.73 m²` }];
    let g = cr;
    if (typeof a.cys === 'number') {
      const c = a.cys / 0.8;
      g = 135 * Math.pow(Math.min(x, 1), female ? -0.219 : -0.144) * Math.pow(Math.max(x, 1), -0.544) * Math.pow(Math.min(c, 1), -0.323) * Math.pow(Math.max(c, 1), -0.778) * Math.pow(0.9961, a.age) * (female ? 0.963 : 1);
      lines.push({ label: 'Creatinine-cystatin C equation', value: `${r(g)} mL/min/1.73 m²` });
    }
    return { level: g >= 60 ? 1 : g >= 30 ? 2 : g >= 15 ? 3 : 4, headline: `Estimated GFR ${r(g)} mL/min/1.73 m², stage ${stage(r(g))}`, lines };
  },
  evidence: {
    reference: 'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749.',
    pmid: '34554658',
    population: 'Developed in 10 studies (8254 participants, 31.5% Black) for creatinine and 13 studies (5352 participants) for creatinine and cystatin C; validated in 12 other studies (4050 participants).',
    validation: 'Compared with measured GFR, 85% or more of estimates were within 30% in Black and non-Black participants. The creatinine-cystatin C equation was more accurate.',
    prevalence: null, developed: 8254, validated: 4050,
    comment: 'Recommended by the NKF-ASN Task Force (2021) for US laboratories. Replaces the MDRD and Mayo quadratic equations used on EE+.'
  }
};
