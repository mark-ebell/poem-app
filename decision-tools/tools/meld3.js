// MELD 3.0 (Kim 2021). Replaces the 2001 MELD (Kamath; EE+ 193) at Mark Ebell's request (2026-10-26).
module.exports = {
  id: 'meld3',
  eeId: 193,
  title: 'MELD 3.0',
  subtitle: '90-day survival in end-stage liver disease (adults)',
  question: 'For an adult with end-stage liver disease, what is the MELD 3.0 score and the estimated 90-day survival?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'bili', type: 'number', label: 'Bilirubin', unit: 'mg/dL', min: 0.1, max: 80, step: 0.1 },
    { id: 'na', type: 'number', label: 'Sodium', unit: 'mmol/L', min: 100, max: 170, step: 1 },
    { id: 'inr', type: 'number', label: 'INR', min: 0.5, max: 15, step: 0.1 },
    { id: 'creat', type: 'number', label: 'Creatinine', unit: 'mg/dL', min: 0.1, max: 20, step: 0.1 },
    { id: 'albumin', type: 'number', label: 'Albumin', unit: 'g/dL', min: 0.5, max: 6, step: 0.1 },
    { type: 'heading', label: 'Check if present' },
    { id: 'dialysis', type: 'check', label: 'Dialysis at least twice (or CVVHD for 24 hours) in the past week' }
  ],
  footnote: 'Bilirubin, INR and creatinine below 1 count as 1; creatinine is capped at 3.0 mg/dL (and set to 3.0 with dialysis); sodium is bounded at 125 to 137 mmol/L and albumin at 1.5 to 3.5 g/dL.',
  compute(a) {
    const bili = Math.max(1, a.bili), inr = Math.max(1, a.inr), cr = a.dialysis ? 3 : Math.min(3, Math.max(1, a.creat));
    const na = Math.min(137, Math.max(125, a.na)), alb = Math.min(3.5, Math.max(1.5, a.albumin));
    const meld = Math.round((a.sex === 1 ? 1.33 : 0) + 4.56 * Math.log(bili) + 0.82 * (137 - na) - 0.24 * (137 - na) * Math.log(bili) + 9.09 * Math.log(inr)
      + 11.14 * Math.log(cr) + 1.85 * (3.5 - alb) - 1.83 * (3.5 - alb) * Math.log(cr) + 6);
    const survival = 100 * Math.pow(0.946, Math.exp(0.17698 * meld - 3.56));
    return { score: { value: meld, label: 'MELD 3.0' }, headline: `Estimated 90-day survival: ${survival.toFixed(1)}%` };
  },
  evidence: {
    reference: 'Kim WR, Mannalithara A, Heimbach JK, et al. MELD 3.0: the Model for End-Stage Liver Disease updated for the modern era. Gastroenterology. 2021;161(6):1887-1895.',
    pmid: '34481845',
    population: 'Developed in adults on the US liver transplant waiting list (OPTN registry, 2016 to 2018); adopted for US liver allocation in 2023.',
    validation: 'C statistic 0.869, slightly better than MELD-Na (0.862).',
    prevalence: null, developed: null, validated: null,
    comment: 'Replaces the original 2001 MELD (Kamath) used on EE+. Not for acute liver failure.'
  }
};
